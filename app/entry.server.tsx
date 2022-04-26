import { renderToString } from "react-dom/server";
import faunadb from "faunadb";
import dotenv from 'dotenv';
import type { EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";

dotenv.config({path: '.env.production'});

if (!process.env.FAUNA) throw Error('ENV Not Working');

export async function clientQuery (...args) {
  const client = new faunadb.Client({
    secret: process.env.FAUNA || '',
    keepAlive: false,
    domain: 'db.us.fauna.com',
    fetch: (url, params) => {
      const signal = params.signal
      delete params.signal
      const abortPromise = new Promise(resolve => {
        if (signal) {
          signal.onabort = resolve
        }
      })
      return Promise.race([abortPromise, fetch(url, params)])
    },
  })
  return client.query(...args);
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
}
