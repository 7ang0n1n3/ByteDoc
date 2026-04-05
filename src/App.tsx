// src/App.tsx
import React, { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useDocumentStore } from './store/documentStore';

export default function App() {
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return <AppShell />;
}
