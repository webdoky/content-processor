import webFeatures from 'web-features/index.json' assert { type: 'json' };
import validateWebFeature from './validate-feature';

export interface BaselineItem {
  baseline: false | 'low' | 'high';
}

export default function getWebFeatureStatus(...features: string[]) {
  if (features.length === 0) {
    return null;
  }

  for (const feature of Object.values(webFeatures)) {
    if (!feature) {
      continue;
    }
    const validatedFeature = validateWebFeature(feature);
    if (
      validatedFeature.status &&
      validatedFeature.compat_features?.some((feature) =>
        features.includes(feature),
      )
    ) {
      return validatedFeature.status;
    }
  }
  return null;
}
