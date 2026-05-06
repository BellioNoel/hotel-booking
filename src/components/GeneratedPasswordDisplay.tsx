// src/components/GeneratedPasswordDisplay.tsx
import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { generateRandomPassword, copyToClipboard } from '../utils/passwordGenerator';

interface GeneratedPasswordDisplayProps {
  onPasswordGenerated: (password: string) => void;
}

export default function GeneratedPasswordDisplay({ onPasswordGenerated }: GeneratedPasswordDisplayProps) {
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const generatePassword = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
    onPasswordGenerated(newPassword);
  };

  const handleCopy = async () => {
    if (!password) return;
    
    const success = await copyToClipboard(password);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Generated Password
        </label>
        <button
          type="button"
          onClick={generatePassword}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Generate New Password
        </button>
      </div>

      {password && (
        <div className="relative">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                readOnly
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Important:</strong> Save this password securely! You'll need it to log in.
              We recommend updating your password after your first login for better security.
            </p>
          </div>
        </div>
      )}

      {!password && (
        <button
          type="button"
          onClick={generatePassword}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
        >
          Generate Random Password
        </button>
      )}
    </div>
  );
}
