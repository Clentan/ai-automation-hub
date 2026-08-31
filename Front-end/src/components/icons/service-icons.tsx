import { FaMicrosoft, FaFilePdf } from 'react-icons/fa';
import { TbWebhook } from 'react-icons/tb';
import { RiOpenaiFill, RiSlackFill } from 'react-icons/ri';
import {
  SiGoogledrive,
  SiGmail,
  SiNotion,
  SiGithub,
  SiDiscord,
  SiTrello,
  SiJira
} from 'react-icons/si';

export const ServiceIcons: Record<string, React.ElementType> = {
  'openai': RiOpenaiFill,
  'google-drive': SiGoogledrive,
  'slack': RiSlackFill,
  'gmail': SiGmail,
  'notion': SiNotion,
  'github': SiGithub,
  'discord': SiDiscord,
  'microsoft': FaMicrosoft,
  'trello': SiTrello,
  'jira': SiJira,
  'webhook': TbWebhook,
  'pdf': FaFilePdf
};

export const ServiceColors: Record<string, string> = {
  'openai': '#412991',
  'google-drive': '#1FA463',
  'slack': '#E01E5A',
  'gmail': '#EA4335',
  'notion': '#000000',
  'github': '#181717',
  'discord': '#5865F2',
  'microsoft': '#00A4EF',
  'trello': '#0052CC',
  'jira': '#0052CC',
  'webhook': '#FF6D5A',
  'pdf': '#D32F2F'
};

export function ServiceIcon({ serviceId, className }: { serviceId: string, className?: string }) {
  const Icon = ServiceIcons[serviceId] || FaMicrosoft;
  const color = ServiceColors[serviceId] || '#000';
  
  return <Icon className={className} style={{ color }} />;
}
