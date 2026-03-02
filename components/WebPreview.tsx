'use client';

import { Sandpack } from "@codesandbox/sandpack-react";

interface WebPreviewProps {
  generatedCode: string;
  showEditor?: boolean;
  onCodeChange?: (code: string) => void;
}

export default function WebPreview({ generatedCode, showEditor = true, onCodeChange }: WebPreviewProps) {
  // Wrap the generated code to ensure it's a valid React component
  const wrappedCode = wrapCode(generatedCode);

  // Create a fallback lucide-react module that returns placeholder for missing icons
  const lucideFallback = `
// Fallback for lucide-react - provides all common icons + fallback for unknown ones
import React from 'react';

const createIcon = (name) => {
  return function Icon({ size = 24, className = '', ...props }) {
    return React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: className,
      ...props
    }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }));
  };
};

// Export common icons as simple SVG placeholders
export const Star = createIcon('Star');
export const Heart = createIcon('Heart');
export const ArrowRight = createIcon('ArrowRight');
export const ArrowLeft = createIcon('ArrowLeft');
export const Check = createIcon('Check');
export const X = createIcon('X');
export const Menu = createIcon('Menu');
export const Search = createIcon('Search');
export const User = createIcon('User');
export const Mail = createIcon('Mail');
export const Phone = createIcon('Phone');
export const MapPin = createIcon('MapPin');
export const Calendar = createIcon('Calendar');
export const Clock = createIcon('Clock');
export const ChevronRight = createIcon('ChevronRight');
export const ChevronLeft = createIcon('ChevronLeft');
export const ChevronDown = createIcon('ChevronDown');
export const ChevronUp = createIcon('ChevronUp');
export const Facebook = createIcon('Facebook');
export const Twitter = createIcon('Twitter');
export const Instagram = createIcon('Instagram');
export const Linkedin = createIcon('Linkedin');
export const Github = createIcon('Github');
export const Youtube = createIcon('Youtube');
export const Globe = createIcon('Globe');
export const ExternalLink = createIcon('ExternalLink');
export const ShoppingCart = createIcon('ShoppingCart');
export const CreditCard = createIcon('CreditCard');
export const Package = createIcon('Package');
export const Truck = createIcon('Truck');
export const Gift = createIcon('Gift');
export const Tag = createIcon('Tag');
export const Percent = createIcon('Percent');
export const Home = createIcon('Home');
export const Building = createIcon('Building');
export const Store = createIcon('Store');
export const Coffee = createIcon('Coffee');
export const Utensils = createIcon('Utensils');
export const UtensilsCrossed = createIcon('UtensilsCrossed');
export const Pizza = createIcon('Pizza');
export const IceCream = createIcon('IceCream');
export const Camera = createIcon('Camera');
export const Image = createIcon('Image');
export const Video = createIcon('Video');
export const Music = createIcon('Music');
export const Headphones = createIcon('Headphones');
export const Mic = createIcon('Mic');
export const Play = createIcon('Play');
export const Pause = createIcon('Pause');
export const Sun = createIcon('Sun');
export const Moon = createIcon('Moon');
export const Cloud = createIcon('Cloud');
export const Zap = createIcon('Zap');
export const Flame = createIcon('Flame');
export const Droplet = createIcon('Droplet');
export const Wind = createIcon('Wind');
export const Leaf = createIcon('Leaf');
export const Shield = createIcon('Shield');
export const Lock = createIcon('Lock');
export const Key = createIcon('Key');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const Bell = createIcon('Bell');
export const MessageCircle = createIcon('MessageCircle');
export const Send = createIcon('Send');
export const Download = createIcon('Download');
export const Upload = createIcon('Upload');
export const Share = createIcon('Share');
export const Copy = createIcon('Copy');
export const Trash = createIcon('Trash');
export const Edit = createIcon('Edit');
export const Plus = createIcon('Plus');
export const Minus = createIcon('Minus');
export const Settings = createIcon('Settings');
export const Filter = createIcon('Filter');
export const Sparkles = createIcon('Sparkles');
export const Soup = createIcon('Soup');
export const Noodles = createIcon('Noodles');
export const Bowl = createIcon('Bowl');

// Catch-all default export with Proxy for any missing icons
const handler = {
  get: function(target, prop) {
    if (prop in target) return target[prop];
    return createIcon(prop);
  }
};

const icons = {
  Star, Heart, ArrowRight, ArrowLeft, Check, X, Menu, Search, User, Mail, Phone,
  MapPin, Calendar, Clock, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Globe, ExternalLink,
  ShoppingCart, CreditCard, Package, Truck, Gift, Tag, Percent, Home, Building,
  Store, Coffee, Utensils, UtensilsCrossed, Pizza, IceCream, Camera, Image, Video,
  Music, Headphones, Mic, Play, Pause, Sun, Moon, Cloud, Zap, Flame, Droplet,
  Wind, Leaf, Shield, Lock, Key, Eye, EyeOff, Bell, MessageCircle, Send,
  Download, Upload, Share, Copy, Trash, Edit, Plus, Minus, Settings, Filter,
  Sparkles, Soup, Noodles, Bowl
};

export default icons;
`;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-white/10">
      <Sandpack
        template="react"
        theme="dark"
        files={{
          "/App.js": {
            code: wrappedCode,
            active: true,
          },
          "/lucide-react.js": {
            code: lucideFallback,
            hidden: true,
          },
          "/styles.css": {
            code: `
/* Custom styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
            `,
            hidden: true,
          },
        }}
        customSetup={{
          dependencies: {},
        }}
        options={{
          showNavigator: true,
          showTabs: showEditor,
          showLineNumbers: true,
          editorHeight: "100%",
          externalResources: [
            "https://cdn.tailwindcss.com",
          ],
          classes: {
            "sp-wrapper": "!h-full",
            "sp-layout": "!h-full",
            "sp-stack": "!h-full",
          },
        }}
      />
    </div>
  );
}

function wrapCode(code: string): string {
  // Rewrite lucide-react imports to use our local fallback
  code = code.replace(/from ['"]lucide-react['"]/g, "from './lucide-react.js'");
  
  // If code already has export default, return as-is
  if (code.includes('export default')) {
    return code;
  }
  
  // If code is just JSX, wrap it in a component
  if (code.trim().startsWith('<')) {
    return `
export default function GeneratedPage() {
  return (
    ${code}
  );
}
`;
  }
  
  // Otherwise, assume it's a function component without export
  return `export default ${code}`;
}
