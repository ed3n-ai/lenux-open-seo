# Handoff: פלואו מנהל תוכן עם WordPress Classic Editor + Yoast

## נתיב עבודה

הריפו הפעיל:

`L:\UbuntuMigration\20260504-084917\home\home\lenux28\open-seo`

הדומיין הפעיל:

`https://app.lenux28.cloud/`

## מצב נוכחי

כבר בוצע ונפרס:

- דשבורד עברית עם בחירת מסלול:
  - `מנהל תוכן`
  - `איש SEO`
- שמירת מסלול לפי משתמש בתוך פרויקט באמצעות `localStorage`
- מסך `תוכן ו-AI`
- יצירת רעיונות בסיסית
- שמירת רעיונות
- יומן תוכן בסיסי
- מעבר מפריט יומן לטופס יצירת טיוטה
- מסך הכנה לפרסום ראשוני
- payload בסיסי ל־WordPress/Yoast
- תוסף WordPress MVP תחת:
  - `services/wordpress-plugin/openseo-bridge`

הגרסה האחרונה שנפרסה:

`7328da13-4b9c-4dbb-8012-747ace8a1f75`

## הבעיה הלוגית הנוכחית

המסכים קיימים, אבל הפלואו עדיין לא מספיק טבעי.

הבעיה המרכזית:

`הכנה לפרסום` מתנהגת כמו טופס payload צדדי, ולא כמו המשך טבעי של עריכת פוסט.

בפועל, פרסום לא צריך להתחיל מרעיון או מטופס נפרד. הוא צריך להתחיל מטיוטה אמיתית שנערכה במסך שמייצג פוסט WordPress.

הפלואו הנכון:

`רעיון -> יומן -> טיוטה -> עורך קלאסי -> Yoast -> שליחה לוורדפרס`

## החלטת מוצר חדשה

להכניס את המודל של `WordPress Classic Editor` באופן מלא, יחד עם `Yoast`.

המשמעות:

- מנהל תוכן לא אמור להרגיש שהוא ממלא JSON או payload טכני.
- הוא אמור להרגיש שהוא מכין פוסט לוורדפרס.
- המסך המרכזי אחרי יצירת טיוטה יהיה עורך פרסום שמדמה את המבנה המוכר של WordPress Classic Editor.
- Yoast יהיה חלק טבעי מאותו מסך, כמו metabox מתחת לעורך.

## מסך היעד

שם מוצע:

`עורך פרסום`

או:

`עורך WordPress`

מבנה מסך:

1. אזור עליון:
   - כותרת הפוסט
   - permalink / slug

2. אזור מרכזי:
   - עורך תוכן ראשי
   - HTML או rich text בשלב הבא
   - בשלב ראשון אפשר להישאר עם textarea, אבל המודל צריך להיות מוכן לעורך עשיר

3. Sidebar בסגנון WordPress:
   - Publish box
   - Categories
   - Tags
   - Post type
   - Status
   - Scheduled date

4. מתחת לתוכן:
   - Yoast SEO box
   - focus keyphrase
   - SEO title
   - slug
   - meta description
   - canonical
   - robots
   - snippet preview בסיסי

5. פעולות:
   - שמירה מקומית
   - יצירת/עדכון draft ב־WordPress
   - פתיחת קישור עריכה ב־WordPress לאחר sync

## מודל נתונים מוצע

במקום `publicationPayload` שטוח, צריך לבנות מודל שמייצג פוסט קלאסי.

שם מוצע:

```ts
type WordPressClassicPostDraft = {
  identity: {
    localDraftId: string;
    calendarItemId?: string;
    externalId: string;
  };
  editor: {
    title: string;
    slug: string;
    contentHtml: string;
    excerpt: string;
  };
  publish: {
    postType: "post" | "page";
    status: "draft" | "pending";
    scheduledAt?: string;
  };
  taxonomy: {
    categories: string[];
    tags: string[];
  };
  yoast: {
    focusKeyphrase: string;
    seoTitle: string;
    metaDescription: string;
    canonical: string;
    robots: string;
    breadcrumbsTitle?: string;
    socialTitle?: string;
    socialDescription?: string;
    socialImageUrl?: string;
  };
  sync: {
    wpPostId?: number;
    editUrl?: string;
    lastSyncedAt?: string;
    lastSyncStatus?: "idle" | "syncing" | "synced" | "error";
    lastSyncError?: string;
  };
};
```

## Payload לתוסף WordPress

המודל הפנימי יכול להיות עשיר, אבל ה־payload לתוסף צריך להיות ברור ויציב.

מבנה מוצע:

```json
{
  "external_id": "openseo_draft_123",
  "post_type": "post",
  "title": "כותרת",
  "slug": "slug",
  "content_html": "<h1>...</h1>",
  "excerpt": "תקציר",
  "status": "draft",
  "scheduled_at": "",
  "categories": ["SEO"],
  "tags": ["Yoast", "WordPress"],
  "yoast": {
    "focus_keyphrase": "מילת מפתח",
    "seo_title": "כותרת SEO",
    "meta_description": "תיאור מטא",
    "canonical": "",
    "robots": "",
    "breadcrumbs_title": "",
    "social_title": "",
    "social_description": "",
    "social_image_url": ""
  }
}
```

## מיפוי Yoast

שדות MVP קיימים/חשובים:

- `_yoast_wpseo_title`
- `_yoast_wpseo_metadesc`
- `_yoast_wpseo_focuskw`
- `_yoast_wpseo_canonical`

שדות אפשריים ל־MVP+:

- `_yoast_wpseo_bctitle`
- `_yoast_wpseo_meta-robots-noindex`
- `_yoast_wpseo_meta-robots-nofollow`
- `_yoast_wpseo_opengraph-title`
- `_yoast_wpseo_opengraph-description`
- `_yoast_wpseo_twitter-title`
- `_yoast_wpseo_twitter-description`

צריך לבדוק את שמות השדות המדויקים לפני הרחבה מלאה, ולא להניח שכל שדה Yoast נשמר באותו פורמט.

## שינויי קוד צפויים

### Frontend

קבצים קיימים רלוונטיים:

- `src/routes/_project/p/$projectId/ai.tsx`
- `src/client/features/content/ContentManagerWorkspace.tsx`
- `src/client/features/content/ContentCalendarSection.tsx`
- `src/client/features/content/ContentIdeasSection.tsx`
- `src/client/features/content/WordPressPublishSection.tsx`
- `src/client/features/content/contentManagerStorage.ts`

כיוון מומלץ:

1. לא להרחיב את `WordPressPublishSection` עוד ועוד.
2. להחליף אותו במודול חדש, לדוגמה:
   - `ClassicEditorWorkspace.tsx`
   - `ClassicEditorTitlePanel.tsx`
   - `ClassicEditorContentPanel.tsx`
   - `ClassicEditorPublishBox.tsx`
   - `ClassicEditorTaxonomyBox.tsx`
   - `YoastSeoBox.tsx`
   - `classicEditorModel.ts`
   - `classicEditorModel.test.ts`

### Storage

בשלב ראשון אפשר להמשיך עם `localStorage`, אבל המודל צריך להיות מוכן להעברה ל־DB.

מפתחות מומלצים:

- role preference
- content ideas
- calendar items
- classic editor drafts

חשוב:

טיוטת עורך קלאסי צריכה להיות משויכת ל:

- פרויקט
- משתמש
- פריט יומן, אם קיים
- טיוטה שנוצרה, אם קיימת

### WordPress plugin

קבצים קיימים:

- `services/wordpress-plugin/openseo-bridge/openseo-bridge.php`
- `services/wordpress-plugin/openseo-bridge/includes/class-openseo-auth.php`
- `services/wordpress-plugin/openseo-bridge/includes/class-openseo-rest.php`
- `services/wordpress-plugin/openseo-bridge/includes/class-openseo-post-mapper.php`
- `services/wordpress-plugin/openseo-bridge/includes/class-openseo-yoast-adapter.php`
- `services/wordpress-plugin/openseo-bridge/includes/class-openseo-settings.php`

כיוון:

- להרחיב את mapper כך שיקבל `yoast` במקום `seo`, או יתמוך בשניהם לתאימות זמנית.
- לשמור scheduled date אם נשלח.
- להחזיר:
  - `ok`
  - `post_id`
  - `status`
  - `edit_url`
  - `updated_existing`

## סדר עבודה מומלץ לחלון הבא

לא לרוץ לקוד מיד.

1. לאפיין state machine קצר:
   - idea created
   - idea saved
   - calendar item planned
   - draft generated
   - classic editor draft opened
   - local changes saved
   - synced to WordPress

2. להגדיר `WordPressClassicPostDraft` סופי.

3. לכתוב בדיקות למודל:
   - יצירת draft מעצם רעיון
   - יצירת draft מטיוטת תוכן
   - מיפוי ל־WordPress payload
   - שמירת Yoast fields
   - slug normalization בלי פגיעה בכותרת

4. לבנות UI ראשוני:
   - Classic Editor layout
   - Publish box
   - Categories/Tags
   - Yoast box

5. לחבר את הפלואו:
   - מפריט יומן אל עורך קלאסי
   - מטיוטה שנוצרה אל עורך קלאסי
   - מהעורך אל WordPress payload

6. רק אחרי שזה עובד:
   - לשקול DB במקום `localStorage`
   - לשקול rich text editor אמיתי

## הערת עבודה חשובה

לא לרוץ לתקן על בסיס ניסוח לא ברור.

המשתמש ביקש קודם להמשיך באפיון ולתקן את הלוגיקה, לא לבצע תיקון נקודתי בלי בירור.

בחלון הבא:

- להתחיל מאפיון קצר.
- לאשר את המודל.
- ורק אז לכתוב קוד.

## משפט פתיחה מומלץ לחלון הבא

```text
אנחנו ממשיכים מ־docs/HANDOFF_CLASSIC_EDITOR_YOAST_FLOW_HE.md.
המטרה היא להחליף את מסך הכנת הפרסום הטכני במודל מלא של WordPress Classic Editor + Yoast.
לפני קוד, נאפיין את state model ואת מעברי הפלואו.
```
