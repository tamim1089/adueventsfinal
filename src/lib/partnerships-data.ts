export type Partner = {
  id: string;
  name: string;
  logo?: string;
  email: string;
  type: 'gov' | 'company' | 'school';
  description: string;
  website?: string;
};

export const PARTNERS_DATA: Partner[] = [
  // Government Organizations
  {
    id: 'gov-1',
    name: 'Ministry of Education',
    email: 'contact@moe.gov.ae',
    type: 'gov',
    description: 'Strategic partner for academic excellence and national educational standards.',
    website: 'https://moe.gov.ae'
  },
  {
    id: 'gov-2',
    name: 'Abu Dhabi Department of Education and Knowledge (ADEK)',
    email: 'info@adek.gov.ae',
    type: 'gov',
    description: 'Coordinating educational initiatives and school development in Abu Dhabi.',
    website: 'https://adek.gov.ae'
  },
  {
    id: 'gov-3',
    name: 'Department of Health - Abu Dhabi',
    email: 'info@doh.gov.ae',
    type: 'gov',
    description: 'Collaborating on health sciences research and medical training programmes.',
    website: 'https://doh.gov.ae'
  },
  
  // Companies
  {
    id: 'comp-1',
    name: 'Etisalat by e&',
    email: 'partners@etisalat.ae',
    type: 'company',
    description: 'Technology partner providing infrastructure and innovation support for student projects.',
    website: 'https://etisalat.ae'
  },
  {
    id: 'comp-2',
    name: 'Mubadala Investment Company',
    email: 'info@mubadala.ae',
    type: 'company',
    description: 'Supporting human capital development and industrial research initiatives.',
    website: 'https://mubadala.com'
  },
  {
    id: 'comp-3',
    name: 'ADNOC',
    email: 'careers@adnoc.ae',
    type: 'company',
    description: 'Strategic partnership for engineering excellence and industrial internships.',
    website: 'https://adnoc.ae'
  },

  // Schools
  {
    id: 'school-1',
    name: 'Al Ain Academy',
    email: 'admin@alainacademy.ae',
    type: 'school',
    description: 'Partner school for early talent identification and university bridge programmes.',
    website: 'https://alainacademy.ae'
  },
  {
    id: 'school-2',
    name: 'Brighton College Abu Dhabi',
    email: 'admissions@brightoncollege.ae',
    type: 'school',
    description: 'Academic collaboration and student exchange programmes.',
    website: 'https://brightoncollege.ae'
  }
];
