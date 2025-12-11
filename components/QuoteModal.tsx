import React, { useRef } from 'react';
import { Button } from './Button';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  subject: string;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, text, subject }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      navigator.clipboard.writeText(text).then(() => {
        alert('クリップボードにコピーしました');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('コピーに失敗しました');
      });
    }
  };

  // Construct mailto link
  // Note: Using a dummy email address as requested
  const mailtoLink = `mailto:info@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">見積もり依頼用テキスト</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-grow overflow-hidden flex flex-col">
          <p className="text-sm text-gray-600 mb-2">
            以下の内容をコピーして、メール本文に貼り付けてください。
          </p>
          <textarea 
            ref={textAreaRef}
            className="w-full flex-grow border rounded p-3 font-mono text-sm bg-gray-50 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={text}
            readOnly
            rows={15}
          />
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <a 
            href={mailtoLink}
            className="inline-flex justify-center items-center px-4 py-2 rounded-md font-medium text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            メールアプリで開く
          </a>
          <Button onClick={handleCopy} variant="primary">
            <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            本文をコピー
          </Button>
          <Button onClick={onClose} variant="secondary">
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};