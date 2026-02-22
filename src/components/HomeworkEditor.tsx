import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Download, Eye, Type, Hash, FileUp, Image as ImageIcon } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface HomeworkContent {
  text: string;
  files?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    data: string;
  }>;
}

interface HomeworkEditorProps {
  value: string;
  isRich: boolean;
  onChange: (value: string, isRich: boolean) => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export const HomeworkEditor: React.FC<HomeworkEditorProps> = ({
  value,
  isRich,
  onChange,
  onCancel,
  onSave,
}) => {
  const [content, setContent] = useState<HomeworkContent>({
    text: value,
    files: [],
  });
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Парсим существующее значение при загрузке
  useEffect(() => {
    if (isRich && value) {
      try {
        const parsed = JSON.parse(value);
        setContent(parsed);
      } catch (e) {
        setContent({ text: value, files: [] });
      }
    } else {
      setContent({ text: value, files: [] });
    }
  }, [value, isRich]);

  const handleSave = () => {
    const jsonValue = JSON.stringify(content);
    onChange(jsonValue, true);
    onSave?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleAddFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result as string;
      const newFile = {
        id: `f${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        data,
      };
      setContent(prev => ({
        ...prev,
        files: [...(prev.files || []), newFile],
      }));
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    setContent(prev => ({
      ...prev,
      files: prev.files?.filter(f => f.id !== fileId) || [],
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const insertFormat = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.text.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<b>${selectedText}</b>`;
        break;
      case 'italic':
        formattedText = `<i>${selectedText}</i>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
    }

    const newText = content.text.substring(0, start) + formattedText + content.text.substring(end);
    setContent(prev => ({ ...prev, text: newText }));
    
    // Восстанавливаем фокус
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const insertFormula = () => {
    const formula = prompt('Введите формулу в формате LaTeX (например: x^2 + y^2 = r^2):');
    if (!formula) return;

    try {
      const rendered = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false,
      });
      const formulaHtml = `<span class="katex-formula" data-formula="${formula}">${rendered}</span>`;
      
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const newText = content.text.substring(0, start) + formulaHtml + content.text.substring(start);
      setContent(prev => ({ ...prev, text: newText }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + formulaHtml.length, start + formulaHtml.length);
      }, 0);
    } catch (e) {
      alert('Ошибка в формуле LaTeX');
    }
  };

  const renderContent = (html: string) => {
    return { __html: html };
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-colors ${
              showPreview ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title={showPreview ? 'Редактировать' : 'Предпросмотр'}
          >
            {showPreview ? <Type className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          {!showPreview && (
            <>
              <button
                onClick={() => insertFormat('bold')}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                title="Жирный"
              >
                <span className="font-bold">B</span>
              </button>
              <button
                onClick={() => insertFormat('italic')}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                title="Курсив"
              >
                <span className="italic">I</span>
              </button>
              <button
                onClick={() => insertFormat('underline')}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                title="Подчёркнутый"
              >
                <span className="underline">U</span>
              </button>
              <button
                onClick={insertFormula}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                title="Формула"
              >
                <Hash className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleAddFile}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <FileUp className="w-4 h-4" />
          Прикрепить файл
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {showPreview ? (
          <div className="min-h-[120px] prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={renderContent(content.text)} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content.text}
            onChange={(e) => setContent(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Введите текст домашнего задания..."
            className="w-full px-4 py-3 min-h-[120px] bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-family-inherit"
            style={{ fontFamily: 'inherit' }}
          />
        )}

        {/* Files */}
        {content.files && content.files.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Прикреплённые файлы:</p>
            <div className="space-y-2">
              {content.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <FileText className="w-4 h-4" />
          Сохранить
        </button>
        {onCancel && (
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
};

// Компонент для просмотра домашнего задания
interface HomeworkViewerProps {
  content: string;
  isRich: boolean;
}

export const HomeworkViewer: React.FC<HomeworkViewerProps> = ({ content, isRich }) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  let data: HomeworkContent = { text: content, files: [] };
  
  if (isRich && content) {
    try {
      data = JSON.parse(content);
    } catch (e) {
      data = { text: content, files: [] };
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadFile = (file: HomeworkContent['files'] extends (infer T)[] ? T : never) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = (type: string) => type.startsWith('image/');

  if (!data.text && (!data.files || data.files.length === 0)) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="space-y-3">
      {/* Text content */}
      {data.text && (
        <div 
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: data.text }}
        />
      )}

      {/* Files */}
      {data.files && data.files.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Прикреплённые файлы:</p>
          <div className="space-y-2">
            {data.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer ${
                    isImage(file.type) ? 'bg-green-100' : 'bg-blue-100'
                  }`}
                  onClick={() => setExpandedFile(file.id)}
                >
                  {isImage(file.type) ? (
                    <ImageIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => downloadFile(file)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                  title="Скачать"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {expandedFile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={() => setExpandedFile(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[calc(90vh-80px)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-900">
                {data.files?.find((f) => f.id === expandedFile)?.name}
              </span>
              <button
                onClick={() => setExpandedFile(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-100 min-h-[200px]">
              {data.files?.find((f) => f.id === expandedFile)?.type.startsWith('image/') ? (
                <img
                  src={data.files?.find((f) => f.id === expandedFile)?.data}
                  alt="Preview"
                  className="max-w-full max-h-[calc(90vh-180px)] rounded-lg"
                />
              ) : (
                <p className="text-gray-300">Предпросмотр недоступен</p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => downloadFile(data.files?.find((f) => f.id === expandedFile)!)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Скачать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};