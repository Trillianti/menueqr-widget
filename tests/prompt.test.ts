import { expect, it } from 'vitest';
import {
  createIntegrationPrompt,
  integrationSnippet,
  releaseInstallSource,
} from '../src/prompt.js';
it('generates instructions for the actual package API with no development origin or secrets', () => {
  const input = {
    restaurant: 'example-restaurant',
    component: 'floating' as const,
    language: 'en' as const,
  };
  const prompt = createIntegrationPrompt(input);
  expect(prompt).toContain('mountReservationFloating');
  expect(prompt).not.toContain('"mode"');
  expect(prompt).toContain(releaseInstallSource);
  expect(prompt).toContain('destroy()');
  expect(prompt).not.toContain('127.0.0.1');
  expect(integrationSnippet(input)).toContain('"restaurant": "example-restaurant"');
});
it('serializes labels as data rather than executable code', () => {
  const result = integrationSnippet({ restaurant: 'example', label: '"; alert(1); //' });
  expect(result).toContain('\\"; alert(1); //');
});
it.each(['button', 'floating', 'tab', 'inline'] as const)(
  'imports the %s component from the shared package root',
  (component) => {
    const snippet = integrationSnippet({ restaurant: 'example', component });
    const name = `mountReservation${component[0]!.toUpperCase()}${component.slice(1)}`;
    expect(snippet).toContain(`import { ${name} } from "@menueqr/widget";`);
    expect(snippet).not.toContain(`@menueqr/widget/${component}`);
    expect(createIntegrationPrompt({ restaurant: 'example', component })).toContain(snippet);
  },
);
