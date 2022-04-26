import { useEffect, useRef } from "react";
import { query as q } from "faunadb";
import { clientQuery } from "~/entry.server";
import { hasUserSessionCookie, USER_ID } from "../sessions";
import type { ActionFunction} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
const { uniqueNamesGenerator, names, colors, animals } = require('unique-names-generator');

const shortName = () => uniqueNamesGenerator({
  dictionaries: [names, animals, colors, names, colors], // colors can be omitted here as not used
  length: 3,
  separator: '-'
}); // big-donkey


export function meta() {
  return { title: "Actions Demo" };
}

// When your form sends a POST, the action is called on the server.
// - https://remix.run/api/conventions#action
// - https://remix.run/guides/data-updates
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

export default function ActionsDemo() {
  // https://remix.run/api/remix#useactiondata
  let actionMessage = useActionData();
  let answerRef = useRef<HTMLInputElement>(null);

  // This form works without JavaScript, but when we have JavaScript we can make
  // the experience better by selecting the input on wrong answers! Go ahead, disable
  // JavaScript in your browser and see what happens.
  // useEffect(() => {
  //   if (actionMessage && answerRef.current) {
  //     answerRef.current.select();
  //   }
  // }, [actionMessage]);

  return (
    <div className="remix__page">
      <main>
        <h2>Share!</h2>
        <p>
          Put your text here
        </p>
        <Form method="post" className="remix__form">
          <label>
            <div>Text:</div>
            <input ref={answerRef} name="text" type="text" />
          </label>
          <div>
            <button>Answer!</button>
          </div>
          {actionMessage ? (
            <p>
              <b>{JSON.stringify(actionMessage?.data, null, 2)}</b>
            </p>
          ) : null}
        </Form>
      </main>
    </div>
  );
}
