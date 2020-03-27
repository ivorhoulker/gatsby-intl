import '@testing-library/jest-dom';
import React from 'react';
import faker from 'faker';
import { render } from '@testing-library/react';
import { wrapPageElement } from '../gatsby-ssr';
import { waitFor } from '@testing-library/dom';

const createMockPageProps = () => {
  const supportedLanguages = Array.from({ length: faker.random.number(5) }, faker.random.locale);
  const originalPath = `/${faker.lorem.slug()}`;
  const lang = faker.random.arrayElement(supportedLanguages);
  return {
    location: {
      pathname: `/${lang}${originalPath}`,
    },
    pageContext: {
      supportedLanguages,
      originalPath,
      siteUrl: faker.internet.url(),
      lang,
    },
  };
};

describe('gatsby-ssr', () => {
  describe('wrapPageElement', () => {
    let element;
    let props;

    beforeEach(() => {
      element = <div>{faker.lorem.sentence()}</div>;
      props = createMockPageProps();
    });

    it('returns the page element if the page is excluded', async done => {
      const pluginOpts = { excludedPages: [props.location.pathname] };
      const { container } = render(wrapPageElement({ element, props }, pluginOpts));

      setTimeout(() => {
        expect(container.querySelector('head')).toBeNull();
        done();
      }, 300);
    });

    it('adds proper SEO tags for non-excluded pages ', async () => {
      render(wrapPageElement({ element, props }, {}));

      const { lang, siteUrl, originalPath, supportedLanguages } = props.pageContext;
      await waitFor(() => {
        expect(document.documentElement.getAttribute('lang')).toEqual(lang);

        const localeMeta = document.querySelector('meta[property="og:locale"]');
        expect(localeMeta.getAttribute('content')).toEqual(lang);

        const canonicalLink = document.head.querySelector('link[rel="canonical"]');
        expect(canonicalLink.getAttribute('href')).toEqual(`${siteUrl}/${lang}${originalPath}`);

        const baseAlternateLink = document.head.querySelector('link[rel="alternate"]');
        expect(baseAlternateLink.getAttribute('href')).toEqual(`${siteUrl}${originalPath}`);
        expect(baseAlternateLink.getAttribute('hrefLang')).toEqual(`x-default`);

        supportedLanguages.forEach(supportedLang => {
          const alternateLink = document.head.querySelector(
            `link[rel="alternate"][hrefLang=${supportedLang}]`
          );
          expect(alternateLink.getAttribute('href')).toEqual(
            `${siteUrl}/${supportedLang}${originalPath}`
          );
        });
      });
    });
  });
});