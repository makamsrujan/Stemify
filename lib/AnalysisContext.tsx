import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadHistory, AnalysisRecord } from './storage';

interface AnalysisContextType {
  record: AnalysisRecord | null;
  setId: (id: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType>({ record: null, setId: () => {} });

export function AnalysisProvider({ children, id }: { children: React.ReactNode; id: string }) {
  const [record, setRecord] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    if (id) loadHistory().then(h => setRecord(h.find(r => r.id === id) || null));
  }, [id]);

  return (
    <AnalysisContext.Provider value={{ record, setId: () => {} }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
