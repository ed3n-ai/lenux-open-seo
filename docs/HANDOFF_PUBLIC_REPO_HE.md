# Handoff: הריפו הציבורי של OpenSEO

## נתיב עבודה

הריפו הפעיל:

`L:\UbuntuMigration\20260504-084917\home\home\lenux28\open-seo`

## מטרה

לסיים את הגרסה הציבורית של המערכת, כך שתהיה מספיק מגובשת למסירה ללקוח:

- מוצר ברור
- חוויית שימוש בעברית
- מסלול חזק ל`מנהל תוכן`
- חיבור WordPress ראשוני עם Yoast
- פריסה תקינה ל־`app.lenux28.cloud`

## מצב נוכחי

בוצע כבר:

- דשבורד ציבורי הוטמע ב־`/p/$projectId`
- נוסף `Dashboard` לניווט
- הדומיין `app.lenux28.cloud` עודכן ועלה לפרודקשן
- Cloudflare Access תקין
- קבצי legal נוספו לריפו
- `wrangler.jsonc` כולל:
  - `AUTH_MODE=cloudflare_access`
  - `TEAM_DOMAIN=https://lenux28.cloudflareaccess.com`
  - `POLICY_AUD=02658f24aad054ef41701ae807642754886abff3af7b6e1308591e4fe790f3d9`

## החלטות מוצר שנקבעו

- כל ה־UI בעברית
- מונחים מקצועיים יכולים להישאר באנגלית
- יש רק 2 מסלולי שימוש:
  - `מנהל תוכן`
  - `איש SEO`
- בחירת המסלול תישמר לפי משתמש בתוך פרויקט
- הציבורי הוא `Community Edition`, לא הגרסה המסחרית המלאה

## עיקרון שפה

כל אלו צריכים להיות בעברית:

- כותרות
- כפתורים
- הסברים
- הודעות שגיאה
- onboarding
- empty states
- tooltips

מונחים שיכולים להישאר באנגלית:

- `SEO`
- `AI`
- `Dashboard`
- `Backlinks`
- `Audit`
- `Content Calendar`
- `SERP`
- `CTA`

## מה כבר קיים בקוד

### דשבורד ציבורי

קובץ:

- [index.tsx](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/src/routes/_project/p/$projectId/index.tsx)

מה יש בו עכשיו:

- Community dashboard
- 2 כרטיסי רמות:
  - `Content Manager`
  - `SEO Operator`
- checklist
- public edition boundary

הערה:

- הדשבורד עדיין לא עברית מלאה, וצריך ליישר אותו.

### ניווט

קובץ:

- [items.ts](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/src/client/navigation/items.ts)

מה יש:

- `Dashboard`
- `מחקר מילות מפתח`
- `מילים שמורות`
- `מעקב דירוגים`
- `סקירת דומיין`
- `קישורים נכנסים`
- `בדיקת אתר`
- `AI`

הערה:

- גם כאן יש עדיין טקסטים באנגלית שצריך ליישר.

### מסך AI / כתיבת תוכן

קבצים:

- [ai.tsx](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/src/routes/_project/p/$projectId/ai.tsx)
- [ContentWriterPanel.tsx](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/src/client/features/content/ContentWriterPanel.tsx)

מה יש:

- מסך AI כללי
- פאנל יצירת טיוטות תוכן
- מגבלת מילים חודשית
- טיוטות אחרונות

הערה:

- המסך הזה צריך להפוך ממסך "AI וסוכנים" למסך עבודה ישיר של `מנהל תוכן`.

## מסמכי אפיון שנכתבו

### פלואו מנהל תוכן

קובץ:

- [CONTENT_MANAGER_FLOW_HE.md](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/docs/CONTENT_MANAGER_FLOW_HE.md)

החלטות עיקריות:

- בחירת סוג שימוש נשמרת לפי משתמש בתוך פרויקט
- פלואו `מנהל תוכן` בנוי מ־5 שלבים:
  1. הגדרת כיוון
  2. יצירת רעיונות
  3. בחירה ושמירה
  4. תכנון ביומן תוכן
  5. יצירת טיוטה

### אינטגרציית WordPress עם Yoast

קובץ:

- [WORDPRESS_YOAST_INTEGRATION_HE.md](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/docs/WORDPRESS_YOAST_INTEGRATION_HE.md)

החלטות עיקריות:

- מסלול ראשון: `Yoast`
- צריך תוסף WordPress ייעודי
- OpenSEO מכין payload
- התוסף יוצר `draft` ב־WordPress ושומר שדות Yoast

שדות Yoast ל־MVP:

- `meta title`
- `meta description`
- `focus keyword`
- `canonical` אופציונלי

## שירות WordPress שכבר קיים

יש כבר בסיס תחת:

- [services/wordpress-api](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api)

קבצים חשובים:

- [main.py](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api/app/main.py)
- [schemas.py](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api/app/schemas.py)
- [drafts.py](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/services/wordpress-api/app/drafts.py)

מה כבר יש שם:

- אימות API key
- הגבלת `allowed sites`
- יצירת draft
- endpoint של `prepare post`

## קבצי legal שנוספו

- [NOTICE](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/NOTICE)
- [CONTRIBUTING.md](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/CONTRIBUTING.md)
- [SECURITY.md](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/SECURITY.md)
- [TRADEMARKS.md](L:/UbuntuMigration/20260504-084917/home/home/lenux28/open-seo/TRADEMARKS.md)

הערה:

- הקבצים האלו רלוונטיים לריפו בלבד, לא ל־deploy האפליקטיבי.

## מה נשאר לביצוע

סדר מומלץ:

1. עברית מלאה בדשבורד ובניווט
2. onboarding לבחירת מסלול:
   - `מנהל תוכן`
   - `איש SEO`
3. שמירת בחירה לפי משתמש בתוך פרויקט
   - אפשר להתחיל עם `localStorage`
4. דשבורד מותאם ל`מנהל תוכן`
5. יומן תוכן בסיסי:
   - שבוע
   - חודש
   - רשימה
   - סטטוסים
6. מסך `הכנה לפרסום`
7. תוסף WordPress עם Yoast MVP
8. בדיקות
9. deploy נוסף

## מה לא להכניס עכשיו

כדי לסיים למסירה, לא להיכנס כרגע ל:

- אוטופיילוט מלא
- marketplace
- אינטגרציות מסחריות רחבות
- workflow מרובה משתמשים
- sync דו־כיווני מורכב עם WordPress
- תמיכה בכמה תוספי SEO במקביל

## הגדרת הצלחה

הגרסה הציבורית תיחשב מוכנה למסירה אם:

- יש onboarding ברור
- יש חוויית `מנהל תוכן` שלמה
- יש יומן תוכן בסיסי
- יש יצירת טיוטה
- יש הכנה לפרסום
- יש שליחה ל־WordPress כ־`draft`
- יש תמיכה ראשונית ב־Yoast
- הכל עולה ועובד ב־`app.lenux28.cloud`
