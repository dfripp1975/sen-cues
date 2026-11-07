// Explicit icon map. Importing the whole lucide namespace shipped every icon
// (~2MB) to the browser, so only icons named in data files are listed here.
// Add a name here when a new tool, category or challenge uses a new icon.
import {
  BookMarked, BookOpen, BookText, BookmarkCheck, Calculator, CalendarDays, CalendarRange, ClipboardList, Clock, Coffee, Compass, Feather, Film, Flame, Globe, HelpCircle, Hourglass, Library, ListOrdered, Mail, MapPin, MessageCircleQuestion, NotebookPen, Palette, Search, Shuffle, Snowflake, Sparkles, Star, Tag, Target, Trophy, Type, UserPlus, Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  BookMarked, BookOpen, BookText, BookmarkCheck, Calculator, CalendarDays, CalendarRange, ClipboardList, Clock, Coffee, Compass, Feather, Film, Flame, Globe, HelpCircle, Hourglass, Library, ListOrdered, Mail, MapPin, MessageCircleQuestion, NotebookPen, Palette, Search, Shuffle, Snowflake, Sparkles, Star, Tag, Target, Trophy, Type, UserPlus, Users,
};

export function getIcon(name: string): LucideIcon {
  return icons[name] || Wrench;
}
