# Local login dev environment

Runs our login build from this repo against the `rosical-iam` local stack, behind a same-origin proxy, with a seeded project, test users and two small OIDC relying parties.

## Prerequisites

- The `rosical-iam` repo next to this one, with Docker running.
- `node` (24+), `corepack` (for pnpm), `docker`, `git`, `ss`.

## Sequence

1. `just dev` in `rosical-iam` (starts ZITADEL on http://localhost:8082 and waits until it is healthy).
2. `./login.sh seed` creates or updates the test data and writes `seed.out.env`. You can run it again. It also sets the branding theme mode to AUTO (instance and org), so the login follows the system theme and the theme toggle works.
3. `./login.sh build` builds `apps/login`. This takes a few minutes.
4. `./login.sh start` starts the build on 127.0.0.1:3100 and the proxy on http://localhost:3200. It passes `DIGISAT_PRODUCT_CLIENTS` from `seed.out.env`.
5. `./login.sh rp` starts the relying parties: http://localhost:4001 (endpoint control) and http://localhost:4002 (hub).

`./login.sh stop` stops the login, the proxy and the relying parties (ports 3100, 3200, 4001, 4002). The stack keeps running; `just stop` in `rosical-iam` stops it.

## URLs

- Login: http://localhost:3200/ui/v2/login/loginname. If you sign in here directly, the instance `defaultRedirectUri` sends you to the hub.
- Endpoint control: http://localhost:4001. Its client id is mapped to the `endpoint-control` product in `DIGISAT_PRODUCT_CLIENTS`.
- Hub: http://localhost:4002. It has no product, so it is not mapped.
- Proxy routing: `/ui/v2/login/*` goes to our build and everything else goes to the stack. The proxy keeps `Host: localhost:3200`, so the issuer is http://localhost:3200.

## Test users

All three users are in the default org `Rosical`. The password for each is `Password1!`.

| User    | Project grant         | Second factor | Expected result                     |
| ------- | --------------------- | ------------- | ----------------------------------- |
| `alice` | `digisat-dev`: `user` | TOTP          | Signs in after a TOTP code          |
| `bob`   | `digisat-dev`: `user` | none          | Signs in with a password only       |
| `carol` | none                  | none          | Gets the "no access" error from the app |

Run `./login.sh totp` to print alice's current TOTP code. You can also add `ALICE_TOTP_SECRET` from `seed.out.env` to an authenticator app.

The project has "check authorization on authentication" (`projectRoleCheck`) turned on. That check produces `Errors.User.GrantRequired`, which the login maps to its "no access" error. `hasProjectCheck` cannot trigger the error here, because all users are in the project's own org.

## How the seed authenticates

The System API user `rosical-ops` only has `SYSTEM_OWNER`, which grants no instance permissions such as projects, users or policies. So the seed signs in the instance admin (`ZITADEL_FIRSTINSTANCE_ORG_HUMAN_*` from the API container) through the Console's OIDC client. It finishes that auth request with the login client's System API key (`SYSTEM_USER_PRIVATE_KEY` from the login container), the same way the login UI does. It then uses the resulting admin access token and deletes the session at the end. No key or token is written to disk.

## Troubleshooting

- `container ... not found` / `not running`: start the stack with `just dev` in `rosical-iam`.
- The seed fails at `/v2/sessions`: the admin password from the compose env no longer matches. Reset the admin password in the Console, or recreate the stack with `just clean` and then `just dev`.
- Port already in use: run `./login.sh stop`. Logs are in `logs/` (`login.log`, `proxy.log`, `rp.log`).
- The RP shows "unknown state": the RP was restarted during a sign-in, because it keeps state in memory. Start again from `/`.
- Changes to the login are not visible: run `./login.sh build`, then `./login.sh stop` and `./login.sh start`.
