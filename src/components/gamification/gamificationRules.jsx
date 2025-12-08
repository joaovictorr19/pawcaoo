export const LEVEL_THRESHOLDS = [
    { level: 1, title: "Novato", min: 0, max: 499 },
    { level: 2, title: "Explorador", min: 500, max: 1499 },
    { level: 3, title: "Guardião", min: 1500, max: 3499 },
    { level: 4, title: "Mestre", min: 3500, max: 7499 },
    { level: 5, title: "Lenda", min: 7500, max: Infinity }
];

export const XP_VALUES = {
    BOOKING_COMPLETED: 100,
    REVIEW_RECEIVED: 50,
    VERIFIED_ACCOUNT: 200,
    REFERRAL: 150
};

export function calculateUserStats(userProfile, relatedData = {}) {
    const { 
        bookingsAsOwner = [], 
        bookingsAsProfessional = [], 
        reviewsReceived = [], 
        referrals = [] 
    } = relatedData;

    let totalXP = 0;
    const breakdown = {
        bookings: 0,
        reviews: 0,
        verified: 0,
        referrals: 0,
        manual: userProfile.gamification_xp_manual || 0 // Preserve manually awarded XP if exists
    };

    // 1. Bookings (Completed)
    // Count as owner
    const completedOwner = bookingsAsOwner.filter(b => b.status === 'completed' || b.status === 'service_completed').length;
    // Count as professional
    const completedPro = bookingsAsProfessional.filter(b => b.status === 'completed' || b.status === 'service_completed').length;
    
    const bookingXP = (completedOwner + completedPro) * XP_VALUES.BOOKING_COMPLETED;
    totalXP += bookingXP;
    breakdown.bookings = bookingXP;

    // 2. Reviews Received
    const reviewsXP = reviewsReceived.length * XP_VALUES.REVIEW_RECEIVED;
    totalXP += reviewsXP;
    breakdown.reviews = reviewsXP;

    // 3. Verified Account
    if (userProfile.is_verified) {
        totalXP += XP_VALUES.VERIFIED_ACCOUNT;
        breakdown.verified = XP_VALUES.VERIFIED_ACCOUNT;
    }

    // 4. Referrals
    const referralXP = referrals.length * XP_VALUES.REFERRAL;
    totalXP += referralXP;
    breakdown.referrals = referralXP;

    // 5. Add Manual XP (if system supports manual adjustments)
    totalXP += breakdown.manual;

    // Determine Level
    let currentLevelObj = LEVEL_THRESHOLDS[0];
    let nextLevelObj = LEVEL_THRESHOLDS[1];

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        const tier = LEVEL_THRESHOLDS[i];
        if (totalXP >= tier.min) {
            currentLevelObj = tier;
            nextLevelObj = LEVEL_THRESHOLDS[i + 1] || null;
        } else {
            break; 
        }
    }

    return {
        totalXP,
        currentLevel: currentLevelObj.level,
        levelTitle: currentLevelObj.title,
        nextLevelXP: nextLevelObj ? nextLevelObj.min : null,
        breakdown
    };
}