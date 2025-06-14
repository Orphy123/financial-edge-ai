
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  name: string;
  key: string;
  connected: boolean;
  required: boolean;
}

const ApiKeyManager = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { name: 'TwelveData', key: '', connected: false, required: true },
    { name: 'OpenAI', key: '', connected: false, required: true },
    { name: 'Finnhub', key: '', connected: false, required: true },
    { name: 'Alpha Vantage', key: '', connected: false, required: false }
  ]);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleKeyChange = (name: string, value: string) => {
    setApiKeys(prev => prev.map(api => 
      api.name === name 
        ? { ...api, key: value, connected: value.length > 10 }
        : api
    ));
  };

  const toggleKeyVisibility = (name: string) => {
    setShowKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const maskKey = (key: string) => {
    if (key.length < 8) return key;
    return key.substring(0, 4) + '•'.repeat(Math.max(8, key.length - 8)) + key.substring(key.length - 4);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Key className="h-5 w-5 text-yellow-400" />
          <span>API Configuration</span>
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Configure your API keys to enable real-time data and AI analysis
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apiKeys.map((api) => (
            <div key={api.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-white font-medium">{api.name}</label>
                  {api.required && (
                    <Badge variant="outline" className="text-orange-400 border-orange-400/30 text-xs">
                      Required
                    </Badge>
                  )}
                  {api.connected && (
                    <Check className="h-4 w-4 text-green-400" />
                  )}
                  {api.required && !api.connected && api.key && (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleKeyVisibility(api.name)}
                  className="text-gray-400 hover:text-white"
                >
                  {showKeys[api.name] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Input
                type={showKeys[api.name] ? "text" : "password"}
                placeholder={`Enter ${api.name} API key...`}
                value={showKeys[api.name] ? api.key : maskKey(api.key)}
                onChange={(e) => handleKeyChange(api.name, e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
              
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${
                  api.connected ? 'bg-green-400' : 'bg-gray-600'
                }`} />
                <span className="text-xs text-gray-400">
                  {api.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-400/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> API keys are stored locally in your browser and are never sent to our servers. 
              They are only used to fetch data directly from the respective APIs.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyManager;
