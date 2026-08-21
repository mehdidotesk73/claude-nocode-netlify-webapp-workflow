# Setup Guide: Connect GitHub & Netlify

**You normally don't need this guide.** Claude Code does all of this for you when you paste the
template prompt from the [README](./README.md) — it creates your project on GitHub, fills in your
details, and walks you through the rest. This guide is here as a reference for the few clicks that
have to happen on a website Claude can't click for you, and as a manual fallback if something fails.

## Before You Start

You'll need:
- A GitHub account (free at https://github.com) — this is where your project lives
- A Netlify account (free at https://netlify.com, sign in with GitHub) — this gives you preview links

## Step 1: Your project on GitHub

**Claude Code does this for you.** After you answer its questions about your app, it creates the
project on GitHub and puts all the starting files in place. You'll get a link like
`https://github.com/your-username/your-app-name`.

<details>
<summary>Manual fallback — only if Claude says it couldn't create the project</summary>

1. Go to https://github.com/new
2. **Repository name:** your app name (e.g., `grocery-assistant`)
3. **Description:** optional
4. Leave "Add a README file" **unchecked**
5. Click **Create repository**
6. Copy the page URL and paste it back to Claude

</details>

## Step 2: Enable GitHub Pages for Production

### On GitHub (Web)

1. Go to your repo
2. Click **Settings** (top right)
3. Scroll to **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source:** Select "Deploy from a branch"
   - **Branch:** Select "main" and "/root" folder
5. Click **Save**
6. Wait 1-2 minutes for the build

**Verify:** After the build completes, you'll see a URL like `https://your-username.github.io/repo-name/` — your production site is live there.

## Step 3: Set Up GitHub Branch Protection (Optional but Recommended)

This prevents accidental pushes to `main` and forces code review via pull requests.

### On GitHub (Web)

1. Go to your repo → **Settings** → **Branches** (left sidebar)
2. Under "Branch protection rules," click **Add rule**
3. **Branch name pattern:** Enter `main`
4. Check:
   - "Require a pull request before merging"
   - "Require approvals" (set to 1)
5. Click **Create**

Now all changes must go through a pull request — safer for team workflows.

## Step 4: Connect Netlify for Preview Builds

### On Netlify (Web)

1. Go to https://netlify.com
2. **Sign up or log in** (use your GitHub account for easiest setup)
3. Click **Add new site** → **Import an existing project**
4. Click **GitHub** to authorize Netlify
5. Select your GitHub repo (the one you created in Step 1)
6. Accept default build settings (Netlify auto-detects Vue + Vite)
7. Click **Deploy site**

**Verify:** Netlify will build and deploy. You'll see a URL like `https://your-site-name.netlify.app/` — this is your preview site.

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
