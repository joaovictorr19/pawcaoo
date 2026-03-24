export function calculateCompatibilityScore(professional, userContext) {
  let score = 0;
  let maxPossibleScore = 0;

  // 1. Base Score from Rating & Experience (Max 35 points)
  maxPossibleScore += 35;
  const rating = professional.rating || 0;
  const ratingScore = (rating / 5) * 20; // Up to 20 pts
  
  const experience = professional.experience_years || 0;
  const expScore = Math.min((experience / 10) * 10, 10); // Up to 10 pts for 10+ years
  
  const verificationScore = professional.verification_status === 'verified' ? 5 : 0; // 5 pts for verified
  
  score += ratingScore + expScore + verificationScore;

  // 2. Distance Score (Max 25 points)
  if (userContext?.userLocation && professional.distance !== undefined && professional.distance !== null) {
    maxPossibleScore += 25;
    const dist = professional.distance;
    if (dist <= 2) score += 25;
    else if (dist <= 5) score += 20;
    else if (dist <= 10) score += 15;
    else if (dist <= 20) score += 10;
    else if (dist <= 50) score += 5;
  }

  // 3. Dog Compatibility (Sizes, Breeds, Needs) (Max 30 points)
  if (userContext?.myDogs && userContext.myDogs.length > 0) {
    maxPossibleScore += 30;
    let dogScore = 0;
    
    userContext.myDogs.forEach(dog => {
      let currentDogScore = 0;
      
      // Size Match (10 pts per dog)
      if (professional.dog_sizes && professional.dog_sizes.includes(dog.dog_size)) {
        currentDogScore += 10;
      }
      
      // Breed Match (10 pts per dog)
      if (dog.dog_breed) {
        const hasBreedExp = professional.dog_breeds_handled?.some(b => b.toLowerCase() === dog.dog_breed.toLowerCase()) ||
                            professional.breed_specialization?.some(b => b.toLowerCase() === dog.dog_breed.toLowerCase());
        if (hasBreedExp) {
          currentDogScore += 10;
        }
      }
      
      // Special Needs Match (10 pts per dog)
      const isSenior = dog.age >= 8;
      if (isSenior && professional.specializations?.includes('senior_dogs')) {
        currentDogScore += 10;
      } else if (!isSenior) {
        // If no special needs, give points anyway to not penalize healthy dogs
        currentDogScore += 10;
      }

      dogScore += currentDogScore;
    });
    
    // Average dog score (out of 30)
    score += (dogScore / userContext.myDogs.length);
  }

  // 4. Loyalty / History (Max 10 points)
  if (userContext?.userEmail) {
    maxPossibleScore += 10;
    
    const isFavorite = userContext.favorites?.some(f => f.walker_id === professional.id);
    if (isFavorite) score += 5;
    
    const pastBookings = userContext.pastBookings?.filter(b => b.walker_id === professional.id).length || 0;
    if (pastBookings > 0) score += 5;
  }

  if (maxPossibleScore === 0) return 0;
  
  return Math.round((score / maxPossibleScore) * 100);
}