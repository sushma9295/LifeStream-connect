const compatibilityMap = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

const getCompatibleDonors = (requiredBloodGroup) => {
  return compatibilityMap[requiredBloodGroup] || [];
};

const isCompatible = (donorGroup, recipientGroup) => {
  const compatibleList = getCompatibleDonors(donorGroup);
  return compatibleList.includes(recipientGroup);
};

module.exports = { getCompatibleDonors, isCompatible };
