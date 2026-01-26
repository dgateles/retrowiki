import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  Alert,
  CardGrid,
  CardLink,
  Steps,
  Step,
  SpecList,
  CompatibilityTable,
  DownloadList,
  QuickChecklist,
  HardwareBadge,
  StatCard,
  StatGrid,
  DtbDetector,
  ButtonLayout,
  FirmwareList,
  ConsoleOverview,
} from '@/components/mdx';

/**
 * Custom MDX components for Retro Wiki.
 * Merges Fumadocs default components with custom Retro Wiki components.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Custom Retro Wiki Components
    Alert,
    CardGrid,
    CardLink,
    Steps,
    Step,
    SpecList,
    CompatibilityTable,
    DownloadList,
    QuickChecklist,
    HardwareBadge,
    StatCard,
    StatGrid,
    DtbDetector,
    ButtonLayout,
    FirmwareList,
    ConsoleOverview,
    // Allow page-specific overrides
    ...components,
  };
}
