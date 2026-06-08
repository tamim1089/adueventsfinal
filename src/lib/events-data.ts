const C = "/media/photos";

export type EventItem = {
  slug:       string;
  title:      string;
  organizer:  string;
  venue:      string;
  when:       string;
  attending:  number;
  overview:   string;
  image:      string;
  details?:   string;
};

export const EVENTS_DATA: Record<"upcoming" | "past", EventItem[]> = {
  upcoming: [
    {
      slug: "founders-funding-night",
      title: "Founders & Funding Night", organizer: "Innovation Center",
      venue: "Auditorium A", when: "Today · 6:00 PM", attending: 210,
      overview: "Pitch sessions, investor panels, and networking for student founders.",
      image: `${C}/MaleStudents_Together_On_a_Table_500x350-13.jpeg`,
      details: "Our flagship entrepreneurship event brings together student startups, ADU faculty mentors, and external investors. Expect live pitches, a panel discussion on early-stage funding in the UAE, and an open networking session with light refreshments.",
    },
    {
      slug: "robotics-showcase",
      title: "Robotics Showcase", organizer: "College of Engineering",
      venue: "Lab Building 2", when: "Today · 6:30 PM", attending: 156,
      overview: "Senior projects and autonomous systems demos from the engineering labs.",
      image: `${C}/Student_Working_on_Machinecoe-landing2.jpg`,
      details: "Final-year engineering students present their autonomous systems, robotics projects, and software-hardware integrations. Faculty judges will award prizes for innovation, design, and technical execution.",
    },
    {
      slug: "research-skills-workshop",
      title: "Research Skills Workshop", organizer: "Library",
      venue: "Learning Commons", when: "Tomorrow · 11:00 AM", attending: 88,
      overview: "Hands-on session on databases, citations, and literature reviews.",
      image: `${C}/TwoFemaleStudentsonatable_500x350-14.jpeg`,
      details: "Library staff will guide participants through academic databases (ProQuest, Scopus, Google Scholar), citation management tools, and strategies for structured literature reviews. Suitable for undergraduates and postgraduates alike.",
    },
    {
      slug: "industry-career-fair",
      title: "Industry Career Fair", organizer: "Admission & Registration",
      venue: "Main Hall", when: "Thu · 10:00 AM", attending: 540,
      overview: "Meet employers across engineering, business, health, and law.",
      image: `${C}/StudentsWorkingtogetheronamachinecoe-landing3.jpg`,
      details: "Over 40 companies from the UAE and wider GCC will be present. Bring printed CVs, wear professional attire, and register online in advance to secure a priority time slot.",
    },
  ],
  past: [
    {
      slug: "welcome-week-2026",
      title: "Welcome Week 2026", organizer: "Student Affairs Department",
      venue: "Main Green", when: "Last week", attending: 1200,
      overview: "Orientation, clubs fair, and guided tours for new students.",
      image: `${C}/StudentsWorkingtogetheronamachinecoe-landing3.jpg`,
      details: "A week-long programme of activities welcoming new and returning students to ADU. Highlights included the clubs fair, campus tours, free food stalls, and the President's address.",
    },
    {
      slug: "health-sciences-symposium",
      title: "Health Sciences Symposium", organizer: "College of Health Sciences",
      venue: "Auditorium B", when: "2 weeks ago", attending: 320,
      overview: "Guest lectures and poster sessions on public health research.",
      image: `${C}/TwoFemaleStudentsonatable_500x350-14.jpeg`,
      details: "Leading researchers from ADU and partner institutions presented on topics including chronic disease management, digital health, and community wellness. Student researchers displayed 24 posters.",
    },
  ],
};
