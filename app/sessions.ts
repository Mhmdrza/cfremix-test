// app/sessions.js

import { createCookieSessionStorage } from '@remix-run/cloudflare';
import { nanoid } from 'nanoid';
const USER_ID = 'userId';


async function userSessionCookie (request: Request) {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  if (!session.has(USER_ID)) {
    const id = nanoid();
    session.set(USER_ID, id);
    console.log('cookie set: ' + id);
  }
  return session;
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",

      // all of these are optional
      expires: new Date(Date.now() + 1_200_000),
      httpOnly: true,
    //   maxAge: 60,
      path: "/",
      sameSite: "lax",
      secrets: ["s3cret10"],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession, userSessionCookie as hasUserSessionCookie, USER_ID };