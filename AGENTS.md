<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Auth & accounts
- Accounts are admin-provisioned only (public signup disabled); sign-in resolves username/phone server-side in `accounts.functions.ts`. Why: users never self-assign roles.
- Roles live only in `user_roles`; every admin server function re-checks `has_role` before using the service client. Why: UI gating alone is bypassable.
- Demo personas are client-only localStorage records in `demo-store.tsx`, never written to the backend. Why: keep demo and real accounts separate.
