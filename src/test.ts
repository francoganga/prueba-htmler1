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
    expect(res1).to.equal('/noticias/');

    const res2 = utils.extractSection(url2);
    expect(res2).to.equal('/carreras/ciencias-sociales-y-administracion/');

    const res3 = utils.extractSection(url3);
    expect(res3).to.equal('/carreras/ciencias-sociales-y-administracion/');
  });

  it('should extract slug from url', () => {
    const url1 = '/index.php/noticias/20123-una-noticia';
    const url2 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/';

    const url3 =
      'https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd';

    const res1 = utils.extractSlug(url1);
    expect(res1).to.equal('20123-una-noticia');

    const res2 = utils.extractSlug(url2);
    expect(res2).to.equal('');

    const res3 = utils.extractSlug(url3);
    expect(res3).to.equal('heurigheurigheirugheirugheirgu-asd-asd');
  });

  it('should replace hrefs with relative links', () => {
    const url1 =
      '<a href="http://wwwviejo.unaj.edu.ar/noticias/20123-una-noticia"></a>';
    const url2 =
      '<a href="https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/"></a>';

    const url3 =
      '<a href="https://www.unaj.edu.ar/carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd"></a>';

    const res1 = utils.linksToRelative(url1);
    expect(res1).to.equal('<a href="./noticias/20123-una-noticia"></a>');

    const res2 = utils.linksToRelative(url2);
    expect(res2).to.equal(
      '<a href="./carreras/ciencias-sociales-y-administracion/"></a>'
    );

    const res3 = utils.linksToRelative(url3);
    expect(res3).to.equal(
      '<a href="./carreras/ciencias-sociales-y-administracion/heurigheurigheirugheirugheirgu-asd-asd"></a>'
    );
  });

  it('should replace scripts with relative links', () => {
    const txt =
      '<script type="text/javascript" src="https://www.unaj.edu.ar/wp-content/plugins/magic-action-box/assets/js/responsive-videos.js?ver=2.17.2"></script>';

    const res3 = utils.linksToRelative(txt);
    expect(res3).to.equal(
      '<script type="text/javascript" src="./assets/wp-content/plugins/magic-action-box/assets/js/responsive-videos.js?ver=2.17.2"></script>'
    );
  });
});
