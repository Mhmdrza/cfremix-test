
import { query as q } from "faunadb";
import { commitSession, hasUserSessionCookie, USER_ID } from "../sessions";
import { clientQuery } from "~/entry.server";
import { json } from "@remix-run/cloudflare";
import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/cloudflare";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
const { uniqueNamesGenerator, names, colors, animals } = require('unique-names-generator');

const shortName = () => uniqueNamesGenerator({
  dictionaries: [names, animals, colors, names, colors], // colors can be omitted here as not used
  length: 3,
  separator: '-'
}); // big-donkey


export let meta: MetaFunction = () => {
  return {
    title: "Remix Starter",
    description: "Welcome to remix!"
  };
};

export let loader: LoaderFunction = async ({ request }) => {
  const session = await hasUserSessionCookie(request);
  console.log({session: session.get(USER_ID)});

  const list = await clientQuery(
    q.Map(
      q.Paginate(q.Reverse(q.Documents(q.Collection('publics')))), 
      q.Lambda('shareRef', q.Get(q.Var('shareRef')))
    )
  );
  // https://remix.run/api/remix#json
  return json(list, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export let action: ActionFunction = async ({ request }) => {
  let formData = await request.formData();
  let text = formData.get("text");
  let visibility_level = formData.get("visibilty_level");
  const theCollectionToStore = visibility_level === 'public' ? 'publics' : 'privates';
  const session = await hasUserSessionCookie(request);
  const id = q.NewId();
  return json(await clientQuery(
    q.Create(
      q.Ref(q.Collection(theCollectionToStore), id), {
      data: {
        creator: session.get(USER_ID),
        created_at: q.Now(),
        human_readable_id: shortName(),
        text,
        id
      }
    }
  )));
};

export default function Index() {
  let data = useLoaderData().data;
  let actionMessage = useActionData();

  return (
    <div className="remix__page">
      <main>
        <h1>Clipboard share! </h1>
        <p>trnsfer text quickly between devices; No login required; paste in one device and copy from another one</p>
        <div>
        <Form method="post" className="card">
          <label>
            <div>Text:</div>
            <input name="text" type="text" />
          </label>
            <div>Visibility?</div>
          <label>
            <input name="visibilty_level" type="radio" value="public" defaultChecked/>
            <span>Public</span>
          </label>
          <label>
            <input name="visibilty_level" type="radio" value="private" />
            <span>Private</span>
          </label>
          <div>
            <button>Enter</button>
          </div>
          {actionMessage ? (
            <p>
              <div>{actionMessage?.data.human_readable_id}</div>
            </p>
          ) : null}
        </Form>
        </div>
        <hr/>
        <b>Prevoius entered public Clipboards:</b>
        <div>
          {data?.map((shareDocument: any) => <div key={shareDocument.data.id} className="card d-flex justify-content-between shadow p-3 mb-3">
            <code className="card-body">{(shareDocument.data.text)}</code>
            <button onClick={(e)=>copyTextToClipboard(e, shareDocument.data.text)}>Copy to clipboard!</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function fallbackCopyTextToClipboard(text: string) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(e, text: string) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  e.target.textContent = 'copied!';
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}