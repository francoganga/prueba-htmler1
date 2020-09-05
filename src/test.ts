import * as utils from './utils';

import { expect } from 'chai';

describe('Extract domain and last part of url', () => {
  it('should return first part of url', () => {
    const url1 = '/index.php/noticias/20123-una-noticia';
    const url2 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/';

    const url3 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd';

    const res1 = utils.extractSection(url1);
    expect(res1).to.equal('/index.php/');

    const res2 = utils.extractSection(url2);
    expect(res2).to.equal('https://www.unaj.edu.ar/');

    const res3 = utils.extractSection(url3);
    expect(res3).to.equal('https://www.unaj.edu.ar/');
  });

  it('should extract slug from url', () => {
    const url1 = '/index.php/noticias/20123-una-noticia';
    const url2 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/';

    const url3 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd';

    const res1 = utils.extractSlug(url1);
    expect(res1).to.equal('noticias/20123-una-noticia');

    const res2 = utils.extractSlug(url2);
    expect(res2).to.equal('carreras/ciencias-sociales-y-administracion/');

    const res3 = utils.extractSlug(url3);
    expect(res3).to.equal(
      'carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd'
    );
  });
});
