# DNT CPD Hub: setup and how-to

The CPD Hub lives in the `cpd/` folder of this site:
https://fluoride.dentalnurse.training/cpd/

It is hidden behind the same access code as the OHE course (7774) and is not
linked from the main site, so learners cannot find it until you are ready.

## Try it now (preview mode)

Add `?preview=1` to any CPD page, for example:
https://fluoride.dentalnurse.training/cpd/index.html?preview=1

Preview mode works before anything is set up. You are logged in as a sample
learner ("Jordan Sample") who is also an admin, and a demo course shows every
type of activity. Everything is saved in your own browser only. Use
"Reset preview" in the yellow bar to start again.

## One-off setup before going live

### 1. Create a Firebase project for the CPD Hub
Keep it separate from the Fluoride and OHE projects so records stay apart.

1. Go to console.firebase.google.com and click **Add project** (e.g. "dnt-cpd").
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (choose a London/europe-west2 location).
4. **Build → Storage → Get started** (for pictures and videos). Google now
   asks you to switch the project to the pay-as-you-go **Blaze** plan to use
   Storage. It includes a free allowance (around 5GB stored), and you can set a
   budget alert in Google Cloud so you are warned before any charge. If you
   would rather not, skip Storage: everything else works, and you can use
   YouTube links for videos and picture links from elsewhere.
5. **Project settings → Your apps → Web (</>)** → register an app → copy the
   config values into `cpd/js/config.js` (replace each `REPLACE_WITH_...`).
6. **Authentication → Settings → Authorised domains** → add
   `fluoride.dentalnurse.training`.

### 2. Paste in the security rules
- Firestore → Rules → paste the contents of `cpd/firestore.rules` → Publish.
- Storage → Rules → paste the contents of `cpd/storage.rules` → Publish.

These make sure learners can only see their own records, can only open
courses they have paid for, and only admins can change courses.

### 3. Log in as an admin
Open `cpd/register.html` and create an account with
emily@dentalnurse.training (or erica@). Those two are built-in admins.
After logging in you will see an **Admin** button.

## Adding a course

1. Admin → **Courses → New course**.
2. Fill in **Course details** (title, hours, price, aims, objectives, GDC
   development outcomes). Leave the status as **Draft** while you work.
3. Click each lesson on the left to add text, key point boxes, pictures,
   videos and activities. Use **＋ Add lesson** for more lessons.
4. Add **Quiz** questions and check the **Reflection questions**.
5. Click **Save & preview** to see it exactly as a learner would.
6. In Stripe, create a **Payment Link** for the course. Under *After payment*,
   choose *Don't show confirmation page* and redirect to:
   `https://fluoride.dentalnurse.training/cpd/payment-success.html?c=LINK-NAME`
   (LINK-NAME is shown in the course details). Paste the Payment Link into the
   course.
7. Set the status to **Live** and Save. It appears in the catalogue.

**Building a course with Claude:** ask Claude to write the course as a CPD Hub
course file. In Admin → Courses click **Import course file**, check it in the
editor, then Save. **Download course file** in the editor makes a backup copy.

## Day to day

- **Payments**: when someone clicks Buy they appear here. Check Stripe, click
  **Unlock**, then **Email learner** (opens a ready-written email).
- **Learners**: see everyone's courses and progress, read reflections and
  feedback, open certificates, give free access, remove access or reset progress.
- **Completions**: register of every certificate issued, with a spreadsheet
  export. Keep these records.
- **Feedback**: average ratings, bias reports and comments per course.
- **Pictures & videos**: upload library (pictures up to 10MB, videos up to
  100MB). Never upload anything that could identify a patient without written
  consent.
- **Admins**: add or remove extra admins by email. They create a CPD Hub
  account with that email and the Admin button appears.

## Going live checklist

- [ ] Firebase values in `cpd/js/config.js`
- [ ] Firestore and Storage rules published
- [ ] At least one course set to Live with a working Stripe link
- [ ] Bought a course yourself with a test card / 100% discount code
- [ ] Remove `<script src="js/gate.js"></script>` from the top of each CPD page
      (or ask Claude to) and link the hub from the main site
