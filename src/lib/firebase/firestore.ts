import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import {
  Facility,
  User,
  Patient,
  LabResult,
  SeizureLog,
  AedRecord,
  OcrUpload,
} from '@/types';

// ===============================
// Facility Operations
// ===============================
export async function getFacility(facilityId: string): Promise<Facility | null> {
  const docRef = doc(db, 'facilities', facilityId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Facility;
}

export async function getAllFacilities(): Promise<Facility[]> {
  const querySnapshot = await getDocs(collection(db, 'facilities'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Facility));
}

export async function createFacility(facility: Omit<Facility, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'facilities'), {
    ...facility,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// ===============================
// User Operations
// ===============================
export async function getUser(uid: string): Promise<User | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as User;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, data as DocumentData);
}

export async function getPendingUsers(facilityId: string): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    where('facilityId', '==', facilityId),
    where('approved', '==', false)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as User);
}

export async function getAllUsers(facilityId: string): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    where('facilityId', '==', facilityId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as User);
}

export async function approveUser(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { approved: true });
}

export async function rejectUser(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await deleteDoc(docRef);
}

// ===============================
// Patient Operations
// ===============================
export async function getPatientsByFacility(facilityId: string): Promise<Patient[]> {
  const q = query(
    collection(db, 'patients'),
    where('facilityId', '==', facilityId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  const docRef = doc(db, 'patients', patientId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Patient;
}

export async function createPatient(patient: Omit<Patient, 'createdAt' | 'updatedAt'>): Promise<string> {
  const { id, ...patientData } = patient;
  if (id) {
    const docRef = doc(db, 'patients', id);
    await setDoc(docRef, {
      ...patientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return id;
  } else {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }
}

export async function updatePatient(patientId: string, data: Partial<Patient>): Promise<void> {
  const docRef = doc(db, 'patients', patientId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  } as DocumentData);
}

export async function deletePatient(patientId: string): Promise<void> {
  const docRef = doc(db, 'patients', patientId);
  await deleteDoc(docRef);
}

export async function getNextPatientId(facilityId: string): Promise<string> {
  const patients = await getPatientsByFacility(facilityId);
  const maxNum = patients.reduce((max, p) => {
    const match = p.id.match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  return `${facilityId}-${String(maxNum + 1).padStart(3, '0')}`;
}

// ===============================
// Lab Result Operations
// ===============================
export async function getLabResults(patientId: string): Promise<LabResult[]> {
  const q = query(
    collection(db, 'patients', patientId, 'labResults'),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabResult));
}

export async function getLabResult(patientId: string, labId: string): Promise<LabResult | null> {
  const docRef = doc(db, 'patients', patientId, 'labResults', labId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as LabResult;
}

export async function createLabResult(
  patientId: string,
  labResult: Omit<LabResult, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'patients', patientId, 'labResults'), {
    ...labResult,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateLabResult(
  patientId: string,
  labId: string,
  data: Partial<LabResult>
): Promise<void> {
  const docRef = doc(db, 'patients', patientId, 'labResults', labId);
  await updateDoc(docRef, data as DocumentData);
}

// ===============================
// Seizure Log Operations
// ===============================
export async function getSeizureLogs(patientId: string): Promise<SeizureLog[]> {
  const q = query(
    collection(db, 'patients', patientId, 'seizureLogs'),
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SeizureLog));
}

export async function getSeizureLog(patientId: string, logId: string): Promise<SeizureLog | null> {
  const docRef = doc(db, 'patients', patientId, 'seizureLogs', logId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as SeizureLog;
}

export async function createSeizureLog(
  patientId: string,
  seizureLog: Omit<SeizureLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const logId = `${seizureLog.year}-${String(seizureLog.month).padStart(2, '0')}`;
  await setDoc(doc(db, 'patients', patientId, 'seizureLogs', logId), {
    ...seizureLog,
    id: logId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return logId;
}

export async function updateSeizureLog(
  patientId: string,
  logId: string,
  data: Partial<SeizureLog>
): Promise<void> {
  const docRef = doc(db, 'patients', patientId, 'seizureLogs', logId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  } as DocumentData);
}

// ===============================
// AED Record Operations
// ===============================
export async function getAedRecords(patientId: string): Promise<AedRecord[]> {
  const q = query(
    collection(db, 'patients', patientId, 'aedRecords'),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AedRecord));
}

export async function getAedRecord(patientId: string, recordId: string): Promise<AedRecord | null> {
  const docRef = doc(db, 'patients', patientId, 'aedRecords', recordId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as AedRecord;
}

export async function createAedRecord(
  patientId: string,
  aedRecord: Omit<AedRecord, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'patients', patientId, 'aedRecords'), {
    ...aedRecord,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateAedRecord(
  patientId: string,
  recordId: string,
  data: Partial<AedRecord>
): Promise<void> {
  const docRef = doc(db, 'patients', patientId, 'aedRecords', recordId);
  await updateDoc(docRef, data as DocumentData);
}

// ===============================
// OCR Upload Operations
// ===============================
export async function getOcrUploads(facilityId: string): Promise<OcrUpload[]> {
  const q = query(
    collection(db, 'ocrUploads'),
    where('facilityId', '==', facilityId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OcrUpload));
}

export async function getOcrUpload(uploadId: string): Promise<OcrUpload | null> {
  const docRef = doc(db, 'ocrUploads', uploadId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as OcrUpload;
}

export async function createOcrUpload(
  ocrUpload: Omit<OcrUpload, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'ocrUploads'), {
    ...ocrUpload,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateOcrUpload(uploadId: string, data: Partial<OcrUpload>): Promise<void> {
  const docRef = doc(db, 'ocrUploads', uploadId);
  await updateDoc(docRef, data as DocumentData);
}
