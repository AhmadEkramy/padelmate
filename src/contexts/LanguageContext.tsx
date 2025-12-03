import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', ar: 'الرئيسية' },
  'nav.findMatch': { en: 'Find Player', ar: 'ابحث عن لاعب' },
  'nav.createMatch': { en: 'Create Match', ar: 'إنشاء مباراة' },
  'nav.courts': { en: 'Courts', ar: 'الملاعب' },
  'nav.community': { en: 'Community', ar: 'المجتمع' },
  'nav.profile': { en: 'Profile', ar: 'الملف الشخصي' },
  'nav.admin': { en: 'Admin', ar: 'المسؤول' },
  'nav.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'nav.signup': { en: 'Sign Up', ar: 'إنشاء حساب' },
  
  // Hero
  'hero.title': { en: 'Find Your Padel Partner Nearby', ar: 'ابحث عن شريكك في البادل بالقرب منك' },
  'hero.subtitle': { en: 'Connect with players, book courts, and join matches in your area', ar: 'تواصل مع اللاعبين، احجز الملاعب، وانضم للمباريات في منطقتك' },
  'hero.createProfile': { en: 'Create Profile', ar: 'إنشاء ملف شخصي' },
  'hero.findMatch': { en: 'Find a Match', ar: 'ابحث عن مباراة' },
  
  // Profile
  'profile.title': { en: 'Player Profile', ar: 'ملف اللاعب' },
  'profile.name': { en: 'Name', ar: 'الاسم' },
  'profile.skillLevel': { en: 'Skill Level', ar: 'مستوى المهارة' },
  'profile.beginner': { en: 'Beginner', ar: 'مبتدئ' },
  'profile.intermediate': { en: 'Intermediate', ar: 'متوسط' },
  'profile.advanced': { en: 'Advanced', ar: 'متقدم' },
  'profile.city': { en: 'City / Region', ar: 'المدينة / المنطقة' },
  'profile.nearestCourt': { en: 'Nearest Court', ar: 'أقرب ملعب' },
  'profile.availableTimes': { en: 'Available Times', ar: 'الأوقات المتاحة' },
  'profile.equipment': { en: 'Equipment', ar: 'المعدات' },
  'profile.racket': { en: 'Racket', ar: 'مضرب' },
  'profile.ball': { en: 'Ball', ar: 'كرة' },
  'profile.gender': { en: 'Gender Preference', ar: 'تفضيل الجنس' },
  'profile.male': { en: 'Male', ar: 'ذكر' },
  'profile.female': { en: 'Female', ar: 'أنثى' },
  'profile.mixed': { en: 'Mixed', ar: 'مختلط' },
  'profile.any': { en: 'Any', ar: 'أي' },
  'profile.save': { en: 'Save Profile', ar: 'حفظ الملف الشخصي' },
  'profile.saving': { en: 'Saving...', ar: 'جاري الحفظ...' },
  'profile.saveSuccess': { en: 'Profile saved successfully!', ar: 'تم حفظ الملف الشخصي بنجاح!' },
  
  // Match Finder
  'finder.title': { en: 'Find Your Player', ar: 'ابحث عن لاعبك' },
  'finder.filters': { en: 'Filters', ar: 'الفلاتر' },
  'finder.distance': { en: 'Distance', ar: 'المسافة' },
  'finder.km': { en: 'km', ar: 'كم' },
  'finder.type': { en: 'Type', ar: 'النوع' },
  'finder.invite': { en: 'Invite', ar: 'دعوة' },
  'finder.chat': { en: 'Chat', ar: 'محادثة' },
  'finder.rating': { en: 'Rating', ar: 'التقييم' },
  
  // Create Match
  'create.title': { en: 'Create a Match', ar: 'إنشاء مباراة' },
  'create.date': { en: 'Date', ar: 'التاريخ' },
  'create.time': { en: 'Time', ar: 'الوقت' },
  'create.location': { en: 'Location', ar: 'الموقع' },
  'create.players': { en: 'Players Needed', ar: 'اللاعبين المطلوبين' },
  'create.skillPreference': { en: 'Skill Preference', ar: 'تفضيل المهارة' },
  'create.submit': { en: 'Create Match', ar: 'إنشاء المباراة' },
  'create.nearbyPlayers': { en: 'Nearby Players', ar: 'اللاعبين القريبين' },
  
  // Common
  'common.search': { en: 'Search', ar: 'بحث' },
  'common.apply': { en: 'Apply', ar: 'تطبيق' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.back': { en: 'Back', ar: 'رجوع' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.comingSoon': { en: 'Coming soon', ar: 'قريباً' },
  
  // Index Page
  'index.badge': { en: 'The #1 Padel Partner App', ar: 'تطبيق البادل الشريك الأول' },
  'index.stats.players': { en: 'Players', ar: 'لاعب' },
  'index.stats.courts': { en: 'Courts', ar: 'ملعب' },
  'index.stats.matches': { en: 'Matches', ar: 'مباراة' },
  'index.features.badge': { en: 'Features', ar: 'المميزات' },
  'index.features.title': { en: 'Everything You Need to Play', ar: 'كل ما تحتاجه للعب البادل' },
  'index.features.subtitle': { en: 'An integrated platform that gathers all your needs in one place', ar: 'منصة متكاملة تجمع كل احتياجاتك في مكان واحد' },
  'index.features.title2': { en: 'Everything You Need to Play', ar: 'كل ما تحتاجه للعب' },
  'index.features.subtitle2': { en: 'From finding partners to booking courts, PadelMate has you covered', ar: 'من إيجاد الشركاء إلى حجز الملاعب، PadelMate يغطي كل احتياجاتك' },
  'index.howItWorks.badge': { en: 'How it works', ar: 'كيف يعمل' },
  'index.howItWorks.title': { en: 'Start playing in 3 steps', ar: 'ابدأ اللعب في 3 خطوات' },
  'index.howItWorks.step1.title': { en: 'Create your account', ar: 'أنشئ حسابك' },
  'index.howItWorks.step1.description': { en: 'Register your basic data and your playing level', ar: 'سجل بياناتك الأساسية ومستواك في اللعب' },
  'index.howItWorks.step2.title': { en: 'Search or create a match', ar: 'ابحث أو أنشئ ماتش' },
  'index.howItWorks.step2.description': { en: 'Search for players or create a new match', ar: 'ابحث عن لاعبين أو أنشئ ماتش جديد' },
  'index.howItWorks.step3.title': { en: 'Play and enjoy', ar: 'العب واستمتع' },
  'index.howItWorks.step3.description': { en: 'Communicate with players and set the match time', ar: 'تواصل مع اللاعبين وحدد موعد الماتش' },
  'index.cta.title': { en: 'Ready to Find Your Perfect Partner?', ar: 'هل أنت مستعد لإيجاد شريكك المثالي؟' },
  'index.cta.subtitle': { en: 'Join thousands of Padel enthusiasts and start playing today', ar: 'انضم إلى آلاف عشاق البادل وابدأ اللعب اليوم' },
  'index.cta.button': { en: 'Get Started Free', ar: 'ابدأ مجاناً' },
  
  // Feature Cards
  'features.courtsMap.title': { en: 'Courts Map', ar: 'خريطة الملاعب' },
  'features.courtsMap.description': { en: 'Discover the nearest padel courts with prices and ratings', ar: 'اكتشف أقرب ملاعب البادل مع الأسعار والتقييمات' },
  'features.courtsMap.cta': { en: 'Explore Courts', ar: 'استكشف الملاعب' },
  'features.quickMatch.title': { en: 'Create a Quick Match', ar: 'إنشاء ماتش سريع' },
  'features.quickMatch.description': { en: 'Create a match in less than a minute and invite players to join', ar: 'أنشئ ماتش في أقل من دقيقة وادع لاعبين للانضمام' },
  'features.quickMatch.cta': { en: 'Start Now', ar: 'ابدأ الآن' },
  'features.matchFinder.title': { en: 'Match Finder', ar: 'البحث عن مباراة' },
  'features.matchFinder.description': { en: 'Search for players of your level and close to your location', ar: 'ابحث عن لاعبين بنفس مستواك وقريبين من موقعك' },
  'features.matchFinder.cta': { en: 'Discover More', ar: 'اكتشف المزيد' },
  'features.premium.title': { en: 'Premium Features', ar: 'مميزات ممتازة' },
  'features.premium.description': { en: 'Get exclusive features and top search results', ar: 'احصل على مميزات حصرية وتصدر نتائج البحث' },
  'features.premium.cta': { en: 'Subscribe Now', ar: 'اشترك الآن' },
  'features.chat.title': { en: 'Instant Chat', ar: 'دردشة فورية' },
  'features.chat.description': { en: 'Communicate with players and coordinate match details easily', ar: 'تواصل مع اللاعبين ونسّق تفاصيل الماتش بسهولة' },
  'features.chat.cta': { en: 'Start Chat', ar: 'ابدأ المحادثة' },
  'features.community.title': { en: 'Active Community', ar: 'مجتمع نشط' },
  'features.community.description': { en: 'Join groups, share your experiences, and organize local tournaments', ar: 'انضم لمجموعات، شارك خبراتك، ونظم بطولات محلية' },
  'features.community.cta': { en: 'Join Community', ar: 'انضم للمجتمع' },
  
  // Other Features
  'features.findPartners.title': { en: 'Find Partners', ar: 'إيجاد شركاء' },
  'features.findPartners.description': { en: 'Connect with players matching your skill level', ar: 'تواصل مع لاعبين يطابقون مستواك' },
  'features.nearbyCourts.title': { en: 'Nearby Courts', ar: 'الملاعب القريبة' },
  'features.nearbyCourts.description': { en: 'Discover and book courts in your area', ar: 'اكتشف واحجز الملاعب في منطقتك' },
  'features.scheduleMatches.title': { en: 'Schedule Matches', ar: 'جدولة المباريات' },
  'features.scheduleMatches.description': { en: 'Plan games that fit your availability', ar: 'خطط للمباريات التي تناسب وقتك' },
  'features.trackProgress.title': { en: 'Track Progress', ar: 'تتبع التقدم' },
  'features.trackProgress.description': { en: 'Rate players and build your reputation', ar: 'قيم اللاعبين وابنِ سمعتك' },
  
  // Create Match
  'create.subtitle': { en: 'Set up a match and invite nearby players', ar: 'قم بإعداد مباراة وادع اللاعبين القريبين' },
  'create.success': { en: 'Match created successfully!', ar: 'تم إنشاء المباراة بنجاح!' },
  'create.matchDetails': { en: 'Match Details', ar: 'تفاصيل المباراة' },
  'create.locationPlaceholder': { en: 'Enter court name or address', ar: 'أدخل اسم الملعب أو العنوان' },
  'create.select': { en: 'Select', ar: 'اختر' },
  'create.playersCount': { en: 'Players', ar: 'لاعب' },
  'create.anyLevel': { en: 'Any level', ar: 'أي مستوى' },
  'create.creating': { en: 'Creating...', ar: 'جاري الإنشاء...' },
  'create.notificationMessage': { en: 'Once posted, nearby players matching your criteria will be notified and can request to join your match.', ar: 'بمجرد النشر، سيتم إشعار اللاعبين القريبين الذين يطابقون معاييرك ويمكنهم طلب الانضمام إلى مباراتك.' },
  
  // NotFound
  'notfound.title': { en: '404', ar: '404' },
  'notfound.message': { en: 'Oops! Page not found', ar: 'عذراً! الصفحة غير موجودة' },
  'notfound.back': { en: 'Return to Home', ar: 'العودة للرئيسية' },
  
  // Footer
  'footer.description': { en: 'Connect with Padel players, book courts, and join matches in your area.', ar: 'تواصل مع لاعبي البادل، احجز الملاعب، وانضم للمباريات في منطقتك.' },
  'footer.quickLinks': { en: 'Quick Links', ar: 'روابط سريعة' },
  'footer.resources': { en: 'Resources', ar: 'الموارد' },
  'footer.support': { en: 'Support', ar: 'الدعم' },
  'footer.legal': { en: 'Legal', ar: 'قانوني' },
  'footer.followUs': { en: 'Follow Us', ar: 'تابعنا' },
  'footer.copyright': { en: '© 2024 PadelMate. All rights reserved.', ar: '© 2024 PadelMate. جميع الحقوق محفوظة.' },
  'footer.about': { en: 'About Us', ar: 'من نحن' },
  'footer.contact': { en: 'Contact', ar: 'اتصل بنا' },
  'footer.blog': { en: 'Blog', ar: 'المدونة' },
  'footer.help': { en: 'Help Center', ar: 'مركز المساعدة' },
  'footer.faq': { en: 'FAQ', ar: 'الأسئلة الشائعة' },
  'footer.privacy': { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  'footer.terms': { en: 'Terms of Service', ar: 'شروط الخدمة' },
  'footer.websiteCreator': { en: 'Website Creator', ar: 'منشئ الموقع' },
  'footer.computerEngineer': { en: 'Computer Engineer', ar: 'مهندس كمبيوتر' },
  
  // Authentication
  'auth.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'auth.signUp': { en: 'Sign Up', ar: 'إنشاء حساب' },
  'auth.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'auth.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور' },
  'auth.confirmPassword': { en: 'Confirm Password', ar: 'تأكيد كلمة المرور' },
  'auth.displayName': { en: 'Full Name', ar: 'الاسم الكامل' },
  'auth.emailPlaceholder': { en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
  'auth.passwordPlaceholder': { en: 'Enter your password', ar: 'أدخل كلمة المرور' },
  'auth.confirmPasswordPlaceholder': { en: 'Confirm your password', ar: 'أكد كلمة المرور' },
  'auth.displayNamePlaceholder': { en: 'Enter your full name', ar: 'أدخل اسمك الكامل' },
  'auth.loginDescription': { en: 'Sign in to your account to continue', ar: 'قم بتسجيل الدخول إلى حسابك للمتابعة' },
  'auth.signupDescription': { en: 'Create a new account to get started', ar: 'أنشئ حساباً جديداً للبدء' },
  'auth.loggingIn': { en: 'Logging in...', ar: 'جاري تسجيل الدخول...' },
  'auth.creatingAccount': { en: 'Creating account...', ar: 'جاري إنشاء الحساب...' },
  'auth.noAccount': { en: "Don't have an account? ", ar: 'ليس لديك حساب؟ ' },
  'auth.haveAccount': { en: 'Already have an account? ', ar: 'لديك حساب بالفعل؟ ' },
  'auth.loginSuccess': { en: 'Logged in successfully!', ar: 'تم تسجيل الدخول بنجاح!' },
  'auth.signupSuccess': { en: 'Account created successfully!', ar: 'تم إنشاء الحساب بنجاح!' },
  'auth.loginError': { en: 'Failed to login. Please try again.', ar: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.' },
  'auth.signupError': { en: 'Failed to create account. Please try again.', ar: 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.' },
  'auth.invalidEmail': { en: 'Invalid email address.', ar: 'عنوان بريد إلكتروني غير صالح.' },
  'auth.userNotFound': { en: 'User not found.', ar: 'المستخدم غير موجود.' },
  'auth.wrongPassword': { en: 'Incorrect password.', ar: 'كلمة مرور غير صحيحة.' },
  'auth.invalidCredential': { en: 'Invalid email or password.', ar: 'بريد إلكتروني أو كلمة مرور غير صحيحة.' },
  'auth.emailInUse': { en: 'Email is already in use.', ar: 'البريد الإلكتروني مستخدم بالفعل.' },
  'auth.weakPassword': { en: 'Password is too weak.', ar: 'كلمة المرور ضعيفة جداً.' },
  'auth.passwordMismatch': { en: 'Passwords do not match.', ar: 'كلمات المرور غير متطابقة.' },
  'auth.passwordTooShort': { en: 'Password must be at least 6 characters.', ar: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' },
  'auth.permissionError': { en: 'Permission denied. Please check Firestore security rules.', ar: 'تم رفض الإذن. يرجى التحقق من قواعد أمان Firestore.' },
  
  // Match Finder Page
  'matchFinder.title': { en: 'Match Finder', ar: 'البحث عن مباراة' },
  'matchFinder.subtitle': { en: 'Browse and join matches, or create your own', ar: 'تصفح وانضم للمباريات، أو أنشئ مباراتك الخاصة' },
  'matchFinder.filters': { en: 'Filters', ar: 'الفلاتر' },
  'matchFinder.skillLevel': { en: 'Skill Level', ar: 'مستوى المهارة' },
  'matchFinder.location': { en: 'Location', ar: 'الموقع' },
  'matchFinder.type': { en: 'Type', ar: 'النوع' },
  'matchFinder.singles': { en: 'Singles', ar: 'فردي' },
  'matchFinder.doubles': { en: 'Doubles', ar: 'زوجي' },
  'matchFinder.availableTime': { en: 'Available Time', ar: 'الوقت المتاح' },
  'matchFinder.clearFilters': { en: 'Clear Filters', ar: 'مسح الفلاتر' },
  'matchFinder.createMatch': { en: 'Create Match', ar: 'إنشاء مباراة' },
  'matchFinder.joinMatch': { en: 'Join Match', ar: 'انضم للمباراة' },
  'matchFinder.creator': { en: 'Creator', ar: 'المنشئ' },
  'matchFinder.playersJoined': { en: 'Players Joined', ar: 'اللاعبين المنضمين' },
  'matchFinder.playersNeeded': { en: 'Players Needed', ar: 'لاعبين مطلوبين' },
  'matchFinder.noMatches': { en: 'No matches found', ar: 'لم يتم العثور على مباريات' },
  'matchFinder.noMatchesDesc': { en: 'Be the first to create a match!', ar: 'كن أول من ينشئ مباراة!' },
  'matchFinder.ratePlayers': { en: 'Rate Players', ar: 'قيم اللاعبين' },
  'matchFinder.matchCompleted': { en: 'Match Completed', ar: 'اكتملت المباراة' },
  'matchFinder.matchUpcoming': { en: 'Upcoming Match', ar: 'مباراة قادمة' },
  'matchFinder.matchOpen': { en: 'Open Match', ar: 'مباراة مفتوحة' },
  'matchFinder.matchFull': { en: 'Match Full', ar: 'المباراة ممتلئة' },
  'matchFinder.status': { en: 'Status', ar: 'الحالة' },
  'matchFinder.openMatch': { en: 'Open Match', ar: 'مباراة مفتوحة' },
  'matchFinder.fullMatch': { en: 'Full Match', ar: 'مباراة ممتلئة' },
  
  // Rating Modal
  'rating.title': { en: 'Rate Players', ar: 'قيم اللاعبين' },
  'rating.punctuality': { en: 'Punctuality', ar: 'الالتزام بالمواعيد' },
  'rating.skills': { en: 'Skills', ar: 'المهارات' },
  'rating.behavior': { en: 'Behavior', ar: 'السلوك' },
  'rating.teamwork': { en: 'Teamwork', ar: 'العمل الجماعي' },
  'rating.submit': { en: 'Submit Rating', ar: 'إرسال التقييم' },
  'rating.submitting': { en: 'Submitting...', ar: 'جاري الإرسال...' },
  'rating.success': { en: 'Rating submitted successfully!', ar: 'تم إرسال التقييم بنجاح!' },
  'rating.selectPlayer': { en: 'Select Player', ar: 'اختر اللاعب' },
  
  // Invite Modal
  'invite.title': { en: 'Invite Player', ar: 'دعوة لاعب' },
  'invite.description': { en: 'Choose how you want to invite this player', ar: 'اختر كيف تريد دعوة هذا اللاعب' },
  'invite.existingMatch': { en: 'Invite to Existing Match', ar: 'دعوة لمباراة موجودة' },
  'invite.existingMatchDesc': { en: 'Select from your active matches', ar: 'اختر من مبارياتك النشطة' },
  'invite.newMatch': { en: 'Create New Match', ar: 'إنشاء مباراة جديدة' },
  'invite.newMatchDesc': { en: 'Create a new match and automatically invite this player', ar: 'إنشاء مباراة جديدة ودعوة هذا اللاعب تلقائياً' },
  'invite.noActiveMatches': { en: 'No active matches found', ar: 'لم يتم العثور على مباريات نشطة' },
  'invite.sendInvitation': { en: 'Send Invitation', ar: 'إرسال الدعوة' },
  'invite.createMatch': { en: 'Create Match', ar: 'إنشاء مباراة' },
  'invite.createNewMatchMessage': { en: 'You will be redirected to create a new match. After creating the match, the player will be automatically invited.', ar: 'سيتم توجيهك لإنشاء مباراة جديدة. بعد إنشاء المباراة، سيتم دعوة اللاعب تلقائياً.' },
  'invite.creatingFor': { en: 'Creating match and inviting', ar: 'إنشاء مباراة ودعوة' },
  
  // Match Finder Invitations
  'matchFinder.invitationReceived': { en: 'Invitation Received', ar: 'تم استلام الدعوة' },
  'matchFinder.accept': { en: 'Accept', ar: 'قبول' },
  'matchFinder.decline': { en: 'Decline', ar: 'رفض' },
  
  // Profile Matches
  'profile.matches': { en: 'Matches', ar: 'المباريات' },
  'profile.upcomingMatches': { en: 'Upcoming Matches', ar: 'المباريات القادمة' },
  'profile.pastMatches': { en: 'Past Matches', ar: 'المباريات السابقة' },
  'profile.noUpcomingMatches': { en: 'No upcoming matches', ar: 'لا توجد مباريات قادمة' },
  'profile.noPastMatches': { en: 'No past matches', ar: 'لا توجد مباريات سابقة' },
  'matchFinder.leaveMatch': { en: 'Leave Match', ar: 'مغادرة المباراة' },
  'matchFinder.requestSent': { en: 'Request Sent', ar: 'تم إرسال الطلب' },
  'matchFinder.requestToJoin': { en: 'Request to Join', ar: 'طلب للانضمام' },
  'matchFinder.cancelRequest': { en: 'Cancel Request', ar: 'إلغاء الطلب' },
  'profile.matchRequests': { en: 'Match Requests', ar: 'طلبات المباريات' },
  'profile.incomingRequests': { en: 'Incoming Requests', ar: 'الطلبات الواردة' },
  'profile.noRequests': { en: 'No pending requests', ar: 'لا توجد طلبات معلقة' },
  'profile.requestFrom': { en: 'Request from', ar: 'طلب من' },
  'profile.accept': { en: 'Accept', ar: 'قبول' },
  'profile.reject': { en: 'Reject', ar: 'رفض' },
  'profile.requestAccepted': { en: 'Request accepted', ar: 'تم قبول الطلب' },
  'profile.requestRejected': { en: 'Request rejected', ar: 'تم رفض الطلب' },
  'profile.requestCancelled': { en: 'Request cancelled', ar: 'تم إلغاء الطلب' },
  
  // Notifications
  'notifications.title': { en: 'Notifications', ar: 'الإشعارات' },
  'notifications.all': { en: 'All', ar: 'الكل' },
  'notifications.invitations': { en: 'Invitations', ar: 'الدعوات' },
  'notifications.chat': { en: 'Chat', ar: 'المحادثات' },
  'notifications.system': { en: 'System', ar: 'النظام' },
  'notifications.markAllRead': { en: 'Mark all as read', ar: 'تعليم الكل كمقروء' },
  'notifications.noNotifications': { en: 'No notifications', ar: 'لا توجد إشعارات' },
  'notifications.justNow': { en: 'Just now', ar: 'الآن' },
  'notifications.minutesAgo': { en: 'min ago', ar: 'دقيقة مضت' },
  'notifications.hoursAgo': { en: 'hours ago', ar: 'ساعة مضت' },
  'notifications.daysAgo': { en: 'days ago', ar: 'يوم مضت' },
  'notifications.accept': { en: 'Accept', ar: 'قبول' },
  'notifications.decline': { en: 'Decline', ar: 'رفض' },
  'notifications.ratePlayers': { en: 'Rate Players', ar: 'قيم اللاعبين' },
  'notifications.delete': { en: 'Delete notification', ar: 'حذف الإشعار' },
  'notifications.deleted': { en: 'Notification deleted', ar: 'تم حذف الإشعار' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Default context value
const defaultContextValue: LanguageContextType = {
  language: 'ar',
  setLanguage: () => {},
  t: (key: string) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('padelmate-language');
      if (stored === 'en' || stored === 'ar') return stored;
      return 'ar';
    }
    return 'ar';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (language === 'ar') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    }
    localStorage.setItem('padelmate-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context;
};
