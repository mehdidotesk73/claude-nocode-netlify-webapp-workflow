# Setup Guide: Connect GitHub & Netlify

**You normally don't need this guide.** Claude Code does all of this for you when you paste the
template prompt from the [README](./README.md) — it creates your project on GitHub, fills in your
details, and walks you through the rest. This guide is here as a reference for the few clicks that
have to happen on a website Claude can't click for you, and as a manual fallback if something fails.

## Before You Start

You'll need:
- A GitHub account (free at https://github.com) — this is where your project lives
- A Netlify account (free at https://netlify.com, sign in with GitHub) — this gives you preview links

## Step 1: Your project's home on GitHub

This is the one step Claude can't click for you — but it will hand you every value to type, so
you're just filling in blanks. It takes about a minute.

1. Go to https://github.com/new
2. **Repository name:** the name Claude suggested (e.g., `grocery-assistant`)
3. **Description:** the one Claude suggested — optional
4. **Public or Private:** either works. Public if you might share it, Private if not.
5. Leave **"Add a README file"** unchecked, and leave the .gitignore and license dropdowns on "None"
6. Click the green **Create repository** button
7. Copy the address from your browser's address bar and paste it back to Claude

It'll look like `https://github.com/your-username/grocery-assistant`. Once Claude has that link,
it puts all the starting files in place for you — nothing else to do here.

## Step 2: Connect Netlify — this is how you'll see your app

**Do this one.** Netlify gives you a link you can open on your phone to see the app as it's being
built. Without it there's no way to look at your own app, and you'd be describing changes you can't
check. It takes about two minutes.

Do these three parts in order. Part B is the one people skip, and skipping it makes Part C show an
empty list with your project nowhere in it.

### Part A — Create your Netlify account

1. Go to https://netlify.com
2. Click **Sign up** and choose **Sign up with GitHub** (fastest, and it links the two accounts)
3. Approve the permissions screen GitHub shows you

Already have a Netlify account? Just log in and move on to Part B.

### Part B — Give Netlify access to your project

Netlify can only see projects you've explicitly given it access to. That list is set when you
connect it and **doesn't update on its own** — a project created later isn't added. Yours was
created a few minutes ago, so it needs adding now, before you go looking for it on Netlify.

1. Go to **https://github.com/apps/netlify**
2. Look at the button on the right — it tells you which situation you're in:

**If it says "Install"** — you've never connected Netlify to GitHub.

3. Click **Install**
4. If asked which account, choose your own username
5. Choose **All repositories**, then click **Install**

**If it says "Configure"** — Netlify is already connected from a previous project. This is the case
that catches people out, because GitHub won't prompt you about it on its own.

3. Click **Configure**
4. Look at **Repository access**. You'll almost certainly see **Only select repositories** chosen,
   with the project(s) you connected before listed underneath.
5. Add your new project — two ways, pick either:
   - **Simplest:** switch to **All repositories**. Every future project then appears on Netlify
     automatically and you never revisit this page.
   - **Staying selective:** click the **Select repositories** dropdown and choose your new project
     by name. **This adds to the list — your existing project stays connected.** Don't remove
     anything that's already there, or you'll break the site that depends on it.
6. Click **Save**. GitHub may ask for your password.

Tell Claude when this is done, and mention which button you saw — Install or Configure.

### Part C — Import your project

1. Back on https://netlify.com, click **Add new site** → **Import an existing project**
2. Click **GitHub**
3. Your project is in the list — select it

You now land on a **"Review configuration"** page. Most of it is already filled in correctly —
Netlify read the build settings out of your project. There is **one empty field you must fill in**:

4. **Project name** — type your site name here (Claude will tell you what it should be, e.g.
   `grocery-assistant-mehdi`).

   **Don't leave this blank.** Netlify generates a random name if you do, and you end up with a URL
   like `dreamy-yeot-7cce7c.netlify.app` instead of your own. It's harmless but confusing, and every
   preview link you get from then on carries the random name too.

   **If Netlify says the name is taken**, that's normal — all Netlify sites share one pool of names.
   Add something to the end (your name, initials, `-app`) or ask Claude for another. Tell Claude the
   name you settle on so it can update your project's links to match.

5. **Leave everything under "Build settings" exactly as it is.** It should already read:
   - Branch to deploy: `main`
   - Build command: `npm run build`
   - Publish directory: `dist`

   If those are filled in, Netlify found your project's config correctly. Don't change them.

6. Click **Deploy site**

**What you should see:** Netlify builds for a minute or two, then the project page shows a green
**Published** label and a URL — `https://grocery-assistant.netlify.app` (your name, not the
example). Open it on your phone. You should see the app's header and footer.

Tell Claude the URL and what you see on the page.

<details>
<summary>Got a random name like "dreamy-yeot-7cce7c"?</summary>

The Project name field was left blank. Easy to fix, and it changes your URL:

1. In Netlify, open your project
2. Click **Project configuration** (or **Site configuration** in older accounts)
3. Find **Change project name** (or **Change site name**) and enter your intended name
4. Save — your URL becomes `https://your-name.netlify.app`

Do this now rather than later; the name appears in every preview link.

</details>

<details>
<summary>Still says "No repositories found"?</summary>

Part B didn't take effect. Either the grant didn't save, or it was applied to a different GitHub
account than the one that owns your project.

1. Click **Configure Netlify on GitHub** on that same screen — it goes straight to the right place
2. Check the account name at the top matches the one that owns your project
3. Set **Repository access** to **All repositories** → **Save**
4. Return to Netlify and **refresh the page** — the list doesn't always update on its own

</details>

## Step 3: Enable GitHub Pages for Production

This is your permanent public link, updated whenever changes are merged.

### On GitHub (Web)

1. Go to your project on GitHub
2. Click **Settings** (top of the page)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment" → **Source**, select **GitHub Actions**
   - Not "Deploy from a branch" — this project builds itself with a workflow, and picking the
     branch option will publish the raw source files instead of the built app
5. That's it — there's no Save button on this setting

**Verify:** Go to the **Actions** tab. After the next push to `main` you'll see a "Deploy to GitHub
Pages" run; when it goes green your site is live at `https://your-username.github.io/your-repo-name/`.

## Step 4: Protect your live site

**Do this one too.** It's what makes every change arrive as a pull request — which is what gives you
a preview link to check on your phone before the change reaches your live site. Skip it and changes
go straight live with nothing to review.

### On GitHub (Web)

1. Go to your repo → **Settings** → **Branches** (left sidebar)
2. Click the green **Add branch ruleset** button
   - There's also an "Add classic branch protection rule" link next to it. That's the older system —
     use the ruleset button. (If your GitHub only offers the classic one, see the fallback below.)
3. **Ruleset Name:** `protect main` (any name works)
4. **Enforcement status:** change it to **Active**
   - **This is the one to get right.** It starts as *Disabled*, and a disabled ruleset looks
     completely set up while doing nothing at all.
5. **Bypass list:** leave it empty — that's what makes the rule apply to everyone, you included
6. **Target branches** → **Add target** → **Include default branch**
7. Under **Branch rules**, check these three:
   - **Require a pull request before merging** — under *Show additional settings*, leave
     **Required approvals** at **0** (see below)
   - **Require status checks to pass** — under *Show additional settings*, click **Add checks**,
     type `build`, and select it. This is the automatic check that compiles your app on every
     change; requiring it means a version that doesn't build can never reach your live site.
     - Leave **Require branches to be up to date before merging** unchecked — it creates extra
       work on every change for little benefit on a solo project.
   - **Block force pushes** — usually already checked; leave it on
8. Click **Create**

You can still merge your own pull requests — no approval is needed, so nothing blocks you. What
this stops is anything being pushed straight to `main` without a pull request, including by you.

**Leave Required approvals at 0 while you're working solo.** GitHub doesn't let anyone approve their
own pull request, so requiring one approval on a one-person project is a rule nobody can satisfy —
and with an empty bypass list you'd have to come back and edit the ruleset to merge anything. Raise
it only once someone else is actually reviewing your work.

This also applies to Claude — after this, it can't push straight to your live site either, which is
exactly what you want. Every change it makes comes to you as a preview link first.

**Verify it's on:** the ruleset should be listed as **Active**. If it says Disabled, open it and
change Enforcement status.

**If `build` isn't in the checks list**, type the name in anyway — GitHub accepts checks that
haven't run yet, and it'll match once your first pull request runs one. If it still doesn't appear
after that, tell Claude: it means the check is named something else in your project.

<details>
<summary>If your GitHub only shows "Add classic branch protection rule"</summary>

1. Click **Add classic branch protection rule**
2. **Branch name pattern:** `main`
3. Check **Require a pull request before merging**
4. Leave **Require approvals** unchecked
5. Check **Do not allow bypassing the above settings** near the bottom — classic rules exempt repo
   admins by default, and this is what closes that
6. Click **Create**

</details>

<details>
<summary>The options are greyed out or missing</summary>

Branch protection on **private** repos needs a paid GitHub plan. On the free plan, either make the
repo public (Settings → General → bottom → Change visibility) or skip this step — in which case tell
Claude, so it knows to keep using branches and PRs by convention rather than relying on the rule.

</details>

## What the Build Loop Looks Like

Once setup is done, every change follows the same rhythm. You don't need to remember any of it —
Claude drives it and hands you links — but this is what's happening:

1. **You describe a change.** Plain language, or a screenshot with "this bit is wrong."
2. **Claude writes the code** on a side branch, so your live site is never touched mid-change.
3. **Claude gives you a preview link** — `https://deploy-preview-3--your-site-name.netlify.app`.
   Open it on your phone and see the change for real. If it's not right, say so and Claude
   revises; you'll get a new link each round.
4. **Claude gives you a merge link** when you're happy — a GitHub page with a green
   **Merge pull request** button. Click it, then **Confirm merge**. That's you approving the
   change; nothing reaches your live site until you do.
5. **Your live site updates** a minute or two later at your GitHub Pages URL.

Two things are worth knowing:

- **You'll get three links each round, and they do different jobs.** The *preview* is where you look
  at the change. The *live site* is your real app, unchanged — it stays on the old version no matter
  how many previews come and go. The *merge* page is where you accept the change and let it reach
  the live site. Claude labels which is which; if a preview looks wrong, nothing has happened to
  your app.
- **If a change doesn't appear on the preview,** it's almost always the app serving you a cached
  copy. Tap **Reload latest** in the footer, or open the link in a private/incognito tab.

## Step 5: Local Development

### First Time Setup

```bash
npm install
npm run dev
```

This starts a local dev server at `http://localhost:5173` with hot reload — changes appear instantly.

### Before Each Commit

```bash
npm run build
```

This type-checks your code and creates a production bundle. **Always run this before committing** — it catches TypeScript errors and build issues.

### Push Your Changes

```bash
git add .
git commit -m "Description of what you changed"
git push -u origin claude/feature-name
```

Then go to GitHub and open a pull request.

## Step 6: First Deploy

1. **Push to a branch** (from Step 5)
2. **Check Netlify preview** — a link appears in your GitHub PR or at https://app.netlify.com
3. **Test on phone** — open the preview URL on your phone and verify it looks right
4. **Merge the PR** on GitHub (if branch protection is enabled, you'll need an approval first)
5. **Check production** — after merging to `main`, GitHub Pages deploys automatically (2-5 min)
6. **Verify** — go to `https://your-username.github.io/repo-name/` and confirm your changes are live

## Customizing Your Project

Before you start building, edit **CLAUDE.md** and fill in the placeholders at the top:

```
- <REF:purpose> = "What does your app do?"
- <REF:UI-shape> = "How is it organized?"
- <REF:Netlify-app-name> = "your-site-name"
- <REF:external-deps> = "Any APIs or data sources?"
```

Then read **CLAUDE.md** fully — it explains the development workflow and conventions.

## Using Claude Code

Once GitHub and Netlify are set up, open this repo in [Claude Code](https://claude.ai/code) and describe what you want to build. Claude will:

1. Create a branch
2. Make code changes
3. Push to GitHub
4. Generate a Netlify preview link
5. Iterate based on your feedback

You interact via **screenshots and descriptions** — no coding needed.

## Troubleshooting

### "Build failed" on Netlify?
- Check the build logs in Netlify's dashboard
- Common fix: `npm install` locally and verify `npm run build` works before pushing

### "Netlify preview URL not updating"?
- Netlify can take 2-5 minutes to build
- Check Netlify's deployment status in your dashboard (https://app.netlify.com)

### "GitHub Pages not showing my changes"?
- GitHub Pages can take 1-2 minutes to deploy
- Open your repo **Settings → Pages** and check "View deployment" to see status

### "PWA cache showing old version"?
- This is normal — the app caches aggressively
- Tap "Reload latest" in the footer (or open in private/incognito tab)
- See **CLAUDE.md** for more details

---

**Next:** Customize [CLAUDE.md](./CLAUDE.md), then open this repo in Claude Code and start building!
