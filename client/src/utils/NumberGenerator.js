import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Checks if a 10-digit number/ID is already in use in Firestore.
 */
export const isNumberUnique = async (number) => {
  const usersRef = collection(db, 'users');
  const q1 = query(usersRef, where('phone', '==', number));
  const q2 = query(usersRef, where('secondaryPhone', '==', number));
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  return snap1.empty && snap2.empty;
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
    // 1. Full 10-digit repetition (e.g., 9999999999)
    () => {
      const d = Math.floor(Math.random() * 9) + 1;
      return String(d).repeat(10);
    },
    // 2. Twin Triplets at start (e.g., 999 000 xxxx)
    () => {
      const d1 = Math.floor(Math.random() * 9) + 1;
      const d2 = (d1 + 1) % 10;
      return `${d1}${d1}${d1}${d2}${d2}${d2}${Math.floor(1000 + Math.random() * 9000)}`;
    },
    // 3. Sequential 10-digit rise or fall
    () => {
        const start = Math.floor(Math.random() * 2); // 0 or 1
        return [0,1,2,3,4,5,6,7,8,9].slice(start, start + 10).join('') || "1234567890";
    },
    // 4. Repeating alternating pairs (e.g., 121212xxxx)
    () => {
        const d1 = Math.floor(Math.random() * 9) + 1;
        const d2 = Math.floor(Math.random() * 10);
        return `${d1}${d2}${d1}${d2}${d1}${d2}${d1}${d2}${Math.floor(10 + Math.random() * 90)}`;
    },
    // 5. Ending with 000000 (Mega-round)
    () => {
        return `${Math.floor(1000 + Math.random() * 9000)}000000`;
    },
    // 6. Mirror pattern with middle gap (e.g., 12345 54321)
    () => {
        const d1 = Math.floor(Math.random() * 9) + 1;
        const d2 = Math.floor(Math.random() * 10);
        const d3 = Math.floor(Math.random() * 10);
        const d4 = Math.floor(Math.random() * 10);
        const d5 = Math.floor(Math.random() * 10);
        return `${d1}${d2}${d3}${d4}${d5}${d5}${d4}${d3}${d2}${d1}`;
    }
  ];

  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  return randomPattern();
};
