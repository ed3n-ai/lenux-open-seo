# אפיון קצר: אינטגרציית WordPress עם Yoast

## מטרה

לאפשר ל־`מנהל התוכן` לייצר מאמר מוכן ב־OpenSEO, לערוך את שדות ה־SEO
החשובים, ואז לשלוח את התוכן ישירות ל־WordPress כטיוטה מסודרת עם תמיכה
ראשונית ב־Yoast.

המטרה של ה־MVP אינה להחליף את כל עורך WordPress או את כל יכולות Yoast.
המטרה היא לסגור את הפער בין `טיוטת תוכן` לבין `טיוטה מוכנה לעריכה ופרסום`.

## עיקרון ארכיטקטוני

האינטגרציה תיבנה בשתי שכבות:

- שכבת `OpenSEO`
  - מכינה את התוכן, שדות המטא, והיעד לפרסום.
- שכבת `WordPress Plugin`
  - מקבלת payload מאובטח, יוצרת או מעדכנת `draft`, ושומרת meta fields
    רגילים של WordPress יחד עם meta fields של Yoast.

הבחירה ב־Yoast היא למסלול הראשון בלבד. המבנה צריך להישאר פתוח בעתיד ל־SEO
adapters נוספים.

## מה כבר קיים בריפו

שירות `services/wordpress-api` כבר כולל:

- אימות API key
- בדיקת `allowed sites`
- יצירת draft תוכני
- endpoint של `prepare post`

קבצים רלוונטיים:

- [main.py](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api/app/main.py)
- [schemas.py](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api/app/schemas.py)
- [drafts.py](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api/app/drafts.py)

## MVP

### ב־OpenSEO

מסך `הכנה לפרסום ל־WordPress` יקבל:

- כותרת
- slug
- תוכן HTML
- excerpt
- סוג יעד:
  - `פוסט`
  - `עמוד`
- קטגוריה
- תגיות
- סטטוס יעד:
  - `draft`
  - `pending`
- שדות SEO:
  - `meta title`
  - `meta description`
  - `focus keyword`
  - `canonical` אופציונלי
  - `robots` אופציונלי

### ב־WordPress Plugin

התוסף יבצע:

- אימות בקשה נכנסת מ־OpenSEO
- יצירת `draft` חדש
- עדכון `draft` קיים לפי מזהה חיצוני
- שיוך קטגוריות ותגיות
- שמירת meta רגיל של WordPress
- שמירת שדות Yoast הרלוונטיים

## שדות Yoast ב־MVP

בשלב הראשון נתמוך רק בשדות המרכזיים:

- `yoast_wpseo_title`
- `yoast_wpseo_metadesc`
- `yoast_wpseo_focuskw`
- `yoast_wpseo_canonical` אם הוגדר

אם שדה מסוים לא הוזן, התוסף לא יכריח ערך מלאכותי.

## מודל עבודה למשתמש

הפלואו של `מנהל התוכן` יתארך כך:

1. בוחר או יוצר רעיון תוכן
2. מייצר טיוטה
3. בודק את המאמר
4. נכנס למסך `הכנה לפרסום`
5. בוחר:
   - לאיזה אתר
   - לאיזה post type
   - לאיזו קטגוריה
   - אילו תגיות
6. עורך שדות SEO
7. שולח ל־WordPress
8. מקבל אישור עם:
   - סטטוס
   - מזהה פוסט
   - קישור לעריכה ב־WordPress

## מה לא נכנס ל־MVP

- פרסום אוטומטי ל־`publish`
- העלאת featured image ממדיה מרוחקת
- תמיכה מלאה ב־Open Graph ו־Twitter cards
- sync דו־כיווני בין OpenSEO ל־WordPress
- תמיכה ביותר מפלאגין SEO אחד
- SEO score מקומי בסגנון Yoast

## API בין OpenSEO לתוסף

ה־plugin יחשוף endpoint פנימי מאובטח, לדוגמה:

- `POST /wp-json/openseo/v1/posts/upsert`

payload מוצע:

```json
{
  "external_id": "draft_123",
  "post_type": "post",
  "title": "כותרת מאמר",
  "slug": "kotertet-maamar",
  "content_html": "<h1>...</h1>",
  "excerpt": "תקציר",
  "status": "draft",
  "categories": ["SEO", "תוכן"],
  "tags": ["יוסט", "וורדפרס"],
  "seo": {
    "meta_title": "כותרת SEO",
    "meta_description": "תיאור מטא",
    "focus_keyword": "מחקר מילות מפתח",
    "canonical": "",
    "robots": ""
  }
}
```

## מבנה תוסף WordPress

מבנה מינימלי:

- `openseo-bridge.php`
- `includes/class-openseo-auth.php`
- `includes/class-openseo-rest.php`
- `includes/class-openseo-post-mapper.php`
- `includes/class-openseo-yoast-adapter.php`
- `includes/class-openseo-settings.php`

אחריות:

- `auth`
  - אימות API key / shared secret
- `rest`
  - רישום endpoint
- `post mapper`
  - מיפוי payload לשדות WordPress
- `yoast adapter`
  - מיפוי לשדות Yoast
- `settings`
  - הגדרות plugin בלוח הניהול

## קריטריון הצלחה

משתמש צריך להיות מסוגל:

- לכתוב טיוטה ב־OpenSEO
- לבחור קטגוריה ותגיות
- לערוך `meta title` ו־`meta description`
- לשלוח ל־WordPress
- לפתוח את הטיוטה שם ולראות שהתוכן ושדות Yoast נשמרו נכון
