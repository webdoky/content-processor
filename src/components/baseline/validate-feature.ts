import {
  type Output,
  array,
  literal,
  object,
  optional,
  parse,
  string,
  union,
  record,
} from 'valibot';

const WebFeatureSchema = object({
  compat_features: optional(array(string())),
  status: optional(
    object({
      baseline: union([literal(false), literal('low'), literal('high')]),
      baseline_low_date: optional(string()),
      support: record(string()),
    }),
  ),
});

export type WebFeature = Output<typeof WebFeatureSchema>;

export default function validateWebFeature(feature: unknown): WebFeature {
  return parse(WebFeatureSchema, feature);
}
