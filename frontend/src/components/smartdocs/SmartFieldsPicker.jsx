import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SMART_FIELD_CATEGORIES } from '@/lib/smartDocFieldEngine';
import { User, Briefcase, Home, Ruler, FileText, Shield, Wrench, Box, DollarSign, CheckCircle, Search } from 'lucide-react';

const ICON_MAP = {
  User,
  Briefcase,
  Home,
  Ruler,
  FileText,
  Shield,
  Wrench,
  Box,
  DollarSign,
  CheckCircle,
};

export default function SmartFieldsPicker({ onFieldInsert, availableFields = SMART_FIELD_CATEGORIES }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('customer');

  const categories = Object.entries(availableFields).filter(([_, config]) => config.fields?.length > 0);

  const searchResults = searchTerm.trim() ? categories.flatMap(([category, config]) => 
    config.fields
      .filter(field => 
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(field => ({ ...field, category }))
  ) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto">
        {searchTerm ? (
          // Search Results
          <div className="p-4 space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((field) => (
                <div
                  key={field.key}
                  className="p-3 bg-white border rounded-lg hover:border-primary hover:shadow-sm transition cursor-pointer group"
                  onClick={() => onFieldInsert(field.key)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{field.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded inline-block mt-1">{field.key}</code>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No fields found</p>
            )}
          </div>
        ) : (
          // Tabbed Categories
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start border-b bg-transparent rounded-none px-4 pt-2 overflow-x-auto flex-wrap">
              {categories.map(([categoryKey, config]) => {
                const Icon = ICON_MAP[config.icon];
                return (
                  <TabsTrigger
                    key={categoryKey}
                    value={categoryKey}
                    className="flex items-center gap-1 text-xs"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {config.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map(([categoryKey, config]) => (
              <TabsContent
                key={categoryKey}
                value={categoryKey}
                className="flex-1 overflow-y-auto p-4 space-y-2"
              >
                {config.fields.map((field) => (
                  <div
                    key={field.key}
                    className="p-3 bg-white border rounded-lg hover:border-primary hover:shadow-sm transition cursor-pointer group"
                    onClick={() => onFieldInsert(field.key)}
                    title={`Insert ${field.label}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{field.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFieldInsert(field.key);
                        }}
                        title="Insert field"
                      >
                        <span className="text-xl">+</span>
                      </Button>
                    </div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded inline-block mt-1 text-gray-700">
                      {field.key}
                    </code>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}