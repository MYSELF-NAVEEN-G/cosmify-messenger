import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Checks if a 10-digit number/ID is already in use in Firestore.
 */
export const isNumberUnique = async (number) => {
  const q = query(collection(db, 'users'), where('phone', '==', number));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

/**
 * Generates a basic random 10-digit number.
 */
export const generateRandom10Digit = () => {
  let result = '';
  // Ensure the first digit isn't 0 for standard formatting, though not strictly required
  result += Math.floor(Math.random() * 9) + 1;
  for (let i = 0; i < 9; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};

/**
 * Generates a "Fancy" 10-digit number based on patterns.
 */
export const generateFancy10Digit = () => {
  const patterns = [
    // 1. Repeating triplets at start
    () => {
      const d = Math.floor(Math.random() * 9) + 1;
      return `${d}${d}${d}${Math.floor(1000000 + Math.random() * 9000000)}`;
    },
    // 2. Sequential start
    () => {
      const start = Math.floor(Math.random() * 5) + 1;
      return `${start}${start+1}${start+2}${Math.floor(1000000 + Math.random() * 9000000)}`;
    },
    // 3. Symmetric/Mirror pattern
    () => {
        const d1 = Math.floor(Math.random() * 9) + 1;
        const d2 = Math.floor(Math.random() * 10);
        const d3 = Math.floor(Math.random() * 10);
        return `${d1}${d2}${d3}${d3}${d2}${d1}${Math.floor(1000 + Math.random() * 9000)}`;
    },
    // 4. Repeating alternating
    () => {
        const d1 = Math.floor(Math.random() * 9) + 1;
        const d2 = Math.floor(Math.random() * 10);
        return `${d1}${d2}${d1}${d2}${d1}${d2}${Math.floor(1000 + Math.random() * 9000)}`;
    },
    // 5. Ending with 000
    () => {
        return `${Math.floor(1000000 + Math.random() * 9000000)}000`;
    }
  ];

  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  return randomPattern();
};
