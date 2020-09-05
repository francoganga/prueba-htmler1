import * as utils from './utils';

import { expect } from 'chai';

describe('First Tets', () => {
  it('should return first part of url', () => {
    const url1 = '/index.php/noticias/20123-una-noticia';
    const url2 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/';

    const url3 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd';

    const res1 = utils.extractSection(url1);
    expect(res1).to.equal('/index.php/');

    const res2 = utils.extractSection(url1);
    expect(res2).to.equal('https://www.unaj.edu.ar/');

    const res3 = utils.extractSection(url3);
    expect(res3).to.equal('https://www.unaj.edu.ar/');
  });
});
