/**
 * Messages for NextAuth client signIn(..., { redirect: false }) failures.
 */

export function signInFailureToastArabic(errorCode: string | null | undefined): string {
  switch (errorCode) {
    case "CredentialsSignin":
      return "البريد أو كلمة المرور غير صحيحة.";
    case "Configuration":
      return "إعداد المصادقة على الخادم ناقص: أضِف NEXTAUTH_SECRET (أو AUTH_SECRET) إلى Environment Variables على Vercel، وتأكد من NEXTAUTH_URL وقاعدة البيانات، ثم أعد النشر.";
    default:
      return errorCode
        ? `تعذّر بدء الجلسة (${errorCode}). جرّب لاحقاً أو راجع سجلات النشر على Vercel.`
        : "تعذّر بدء الجلسة. تأكّد من الاتصال وإعداد المصادقة على الخادم.";
  }
}
