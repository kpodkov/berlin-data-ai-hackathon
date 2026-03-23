# Git Conventions

> Cross-cutting git hygiene for anyone operating in any Upvest repository.
> Every commit pushed to any branch must be GPG-signed and verified — no exceptions.

---

## Verified Commits (mandatory)

**Never push a commit that is not GPG-verified.** This applies to every branch, every repo, every contributor.

A commit is verified when `git log --show-signature` shows:

```
gpg: Good signature from "Name <email>" [ultimate]
```

A commit is **not verified** (never push) when it shows:

```
gpg: Can't check signature: No public key
gpg: BAD signature
(no signature line at all)
```

---

## Required Git Config

Every contributor must have this in their global `~/.gitconfig`:

```ini
[commit]
    gpgsign = true

[user]
    signingkey = <your-key-id>    # short or long key ID

[gpg]
    program = /opt/homebrew/bin/gpg   # or $(which gpg) on your system
```

Set via CLI:
```bash
git config --global commit.gpgsign true
git config --global user.signingkey <your-key-id>
git config --global gpg.program $(which gpg)
```

Verify your config:
```bash
git config --global --list | grep -E 'gpg|sign|user'
```

---

## Pre-push Hook (automated enforcement)

Install this hook in any repo to block pushes with unverified commits:

```bash
#!/usr/bin/env bash
# .git/hooks/pre-push  (chmod +x)
set -uo pipefail

remote="$1"
url="$2"
z40=0000000000000000000000000000000000000000

while IFS=' ' read -r local_ref local_sha remote_ref remote_sha; do
    # Skip branch deletions
    [[ "$local_sha" == "$z40" ]] && continue

    # Only check commits not already present on the remote.
    # This correctly handles new branches (range="$local_sha" would walk all history).
    range=$(git rev-list "$local_sha" --not --remotes 2>/dev/null) || continue

    while IFS= read -r commit; do
        [[ -z "$commit" ]] && continue

        # Capture exit status explicitly — avoid set -e killing the script
        # before the error message is printed.
        git verify-commit "$commit" &>/dev/null
        status=$?
        if [[ $status -ne 0 ]]; then
            echo "ERROR: Commit $commit is not GPG-verified." >&2
            echo "       Run: git log --show-signature $commit" >&2
            echo "       Fix: ensure commit.gpgsign=true and your GPG key is available." >&2
            exit 1
        fi
    done <<< "$range"
done

exit 0
```

To install in the current repo:
```bash
cp .git/hooks/pre-push.sample .git/hooks/pre-push  # if template exists
# or create fresh:
cat > .git/hooks/pre-push << 'HOOK'
# (paste script above)
HOOK
chmod +x .git/hooks/pre-push
```

---

## Checking Before You Push

Always verify before pushing:

```bash
# Check last N commits for signatures
git log --show-signature -5

# Check a specific range (e.g., everything not on main)
git log --show-signature main..HEAD

# Quick pass/fail check
git log --format="%H %G?" main..HEAD
# G = good sig, B = bad sig, U = unknown, N = no sig
# Any B, U, or N = DO NOT PUSH
```

---

## GPG Key Setup (first time)

```bash
# Generate a key (if you don't have one)
gpg --full-generate-key   # choose RSA 4096, set to never expire

# List your keys
gpg --list-secret-keys --keyid-format=long

# Copy the key ID (the part after rsa4096/)
# Example output: sec rsa4096/0BB1F65494A73D66
git config --global user.signingkey 0BB1F65494A73D66

# Export public key to add to GitHub
gpg --armor --export 0BB1F65494A73D66
# Paste the output at: GitHub → Settings → SSH and GPG keys → New GPG key

# Make sure gpg-agent is running
gpgconf --launch gpg-agent
```

---

## Claude Code Note

When running `git commit` via Claude Code, the sandbox blocks GPG agent socket access. Use `dangerouslyDisableSandbox: true` **only for the commit command** — this is the minimum required scope to allow GPG signing. All other commands stay sandboxed.

---

## Never Do These

- **Never use `--no-gpg-sign`** — bypasses signing silently
- **Never use `--no-verify`** on push — skips the pre-push hook
- **Never push after seeing `Can't check signature`** — unsigned or unverifiable commit
- **Never amend a verified commit without re-signing** — the signature is invalidated on amend

---

## When to Consult This Reference

- Setting up a new machine or GPG key
- Before pushing any branch or opening a PR
- When troubleshooting `gpg: failed to sign the data` errors
- When reviewing whether a branch is safe to merge
