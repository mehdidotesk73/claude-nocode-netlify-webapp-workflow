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

### On Netlify (Web)

1. Go to https://netlify.com
2. **Sign up or log in** — choose "Sign up with GitHub", it's the fastest path
3. Click **Add new site** → **Import an existing project**
4. Click **GitHub** and authorize Netlify when it asks
5. Find and select your project in the list
6. Leave the build settings as they are — Netlify reads them from the project already
7. Click **Deploy site**

**Verify:** Netlify builds for a minute, then shows a URL like `https://your-site-name.netlify.app/`.
Open it on your phone. You should see the app's header and footer. Tell Claude what you see.

You can rename the site under **Site configuration → Change site name** if you want a tidier URL.

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

## Step 4: Branch Protection (Optional)

Prevents accidental direct pushes to `main`, forcing changes through a pull request. Useful if
others will work on the project; skippable if it's just you.

### On GitHub (Web)

1. Go to your repo → **Settings** → **Branches** (left sidebar)
2. Under "Branch protection rules," click **Add rule**
3. **Branch name pattern:** Enter `main`
4. Check "Require a pull request before merging"
5. Click **Create**

Note: if you turn on "Require approvals" and you're working solo, you won't be able to approve your
own pull requests — leave it unchecked unless someone else is reviewing.

### Every Time You Push a Branch

Netlify automatically creates a **Deploy Preview** for every branch and PR. You'll see a comment on your PR with a link like `https://deploy-preview-1--your-site-name.netlify.app/` — this is a live preview of your changes before merging.

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
