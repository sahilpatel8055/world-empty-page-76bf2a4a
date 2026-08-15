import { QuickEnquiry } from "@/components/common/QuickEnquiry";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { ContentSection, DetailLayout } from "@/components/templates/DetailLayout";
import { SectionUrlGrid } from "@/components/course/SectionHub";
import { PromoBanner } from "@/components/course/PromoBanner";
import {
  AuthorBox,
  DataTable,
  LinkCluster,
  QuickFacts,
  References,
  RelatedLinkGrid,
  UpdatedStamp,
} from "@/components/common/Blocks";
import { AppLink } from "@/components/common/AppLink";
import { ApprovalMarquee, SpecialisationBoxes } from "@/components/common/BoxMarquee";
import { getSpecialisation, listOfferingsByUniversity } from "@/data";
import {
  AdmissionInsightSection,
  CareerOpportunitiesSection,
  ExaminationPatternSection,
  RelatedPageLinks,
  ScholarshipInsightSection,
} from "@/components/university/InsightSections";
import { sectionLabels, universitySectionPages } from "@/lib/insightsData";
import {
  FeeComponents,
  LearningSupport,
  ProgrammeDecision,
  ProgrammeSources,
  RequiredDocuments,
} from "@/components/university/CourseDecisionSections";
import { NextStep } from "@/components/common/NextStep";
import { PubCourseResearch } from "@/components/pub/PubBlocks";
import { courseKeyForProgramme, getUniversityCourse, masterResearchDate, siteSlugForMasterSlug } from "@/lib/courseMaster";
import {
  CurriculumSection,
  MasterFacts,
  ScholarshipCategories,
  SpecialisationElectives,
} from "@/components/university/MasterCourseSections";
import { FeeHighlight } from "@/components/university/FeeHighlight";
import { SampleDegreeSection } from "@/components/university/SampleDegreeSection";
import { PlacementSupportSection } from "@/components/university/PlacementSupportSection";
import { SectionBanner } from "@/components/common/SectionBanner";
import { degreeSample } from "@/lib/assets";
import { CareerRolePackages } from "@/components/university/CareerRolePackages";
import { defaultRolesFor } from "@/lib/careerSalaries";
import { getCareerInfo } from "@/lib/insightsData";
import {
  approvalText,
  articleLinks,
  comparisonLinks,
  offeringLinks,
  offeringProfile,
  onlineName,
  providerLinks,
} from "@/lib/entities";
import { specLandingPath } from "@/lib/courseFamily";
import {
  breadcrumbSchema,
  canonical,
  courseSchema,
  faqSchema,
  howToSchema,
  jsonLd,
  pageMeta,
} from "@/lib/seo";

/**
 * Highest-intent programmatic page type: university × programme.
 * URL: /universities/{university}/courses/{course}
 */
export const Route = createFileRoute("/universities/$slug/courses/$course")({
  beforeLoad: ({ params }) => {
    if (offeringProfile(params.slug, params.course)) return;
    // Slug spellings differ between universities ("online-m-com" vs "online-mcom").
    // Resolve to the same degree family for this university instead of 404ing.
    const wanted = courseKeyForProgramme(params.course);
    const slug = siteSlugForMasterSlug(params.slug) ?? params.slug;
    const candidates = listOfferingsByUniversity(slug);
    const match =
      candidates.find((o) => o.programmeSlug === params.course) ??
      (wanted ? candidates.find((o) => courseKeyForProgramme(o.programmeSlug) === wanted) : undefined);
    if (match && (match.programmeSlug !== params.course || slug !== params.slug)) {
      throw redirect({
        to: "/universities/$slug/courses/$course",
        params: { slug, course: match.programmeSlug },
        statusCode: 301,
      });
    }
  },
  loader: ({ params }) => {
    const profile = offeringProfile(params.slug, params.course);
    if (!profile) throw notFound();

    return {
      universityName: profile.university.record.name,
      universityShort: profile.university.record.shortName,
      programmeName: profile.programme.record.name,
      duration: profile.offering.durationLabel,
      feeRange: profile.programme.record.feeRangeLabel,
      lastUpdated: profile.offering.lastUpdated,
      level: profile.programme.record.level,
      admissionProcess: profile.university.record.admissionProcess,
      summary: profile.programme.record.summary,
    };
  },
  head: ({ params, loaderData }) => {
    const path = `/universities/${params.slug}/courses/${params.course}`;
    if (!loaderData) {
      return { meta: [{ title: "Programme not found" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.universityShort} ${loaderData.programmeName}: Fees, Eligibility & Admission 2026`;
    const description = `${loaderData.programmeName} at ${loaderData.universityName} — ${loaderData.duration} duration, ${loaderData.feeRange} fee range, specialisations, eligibility, admission steps and placement support.`;
    return {
      meta: pageMeta({
        title,
        description,
        path,
        modifiedTime: loaderData.lastUpdated,
        author: "AVEDU Editorial Desk",
        keywords: [
          `${loaderData.universityShort} ${loaderData.programmeName} fees`,
          `${loaderData.universityShort} ${loaderData.programmeName} admission`,
          `${loaderData.programmeName} eligibility`,
        ],
      }),
      links: canonical(path),
      scripts: [
        jsonLd(
          courseSchema({
            name: `${loaderData.programmeName} — ${loaderData.universityName}`,
            description: loaderData.summary,
            provider: loaderData.universityName,
            path,
            mode: "online",
            level: loaderData.level,
          }),
        ),
        jsonLd(
          howToSchema({
            name: `How to apply for ${loaderData.programmeName} at ${loaderData.universityShort}`,
            steps: loaderData.admissionProcess,
          }),
        ),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Universities", href: "/universities" },
            { name: loaderData.universityShort, href: `/universities/${params.slug}` },
            { name: loaderData.programmeName, href: path },
          ]),
        ),
      ],
    };
  },
  component: Page,
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold">Programme not found</h1>
      <AppLink to="/universities" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
        Browse all universities →
      </AppLink>
    </div>
  ),
});

function Page() {
  const { slug, course } = Route.useParams();
  const profile = offeringProfile(slug, course)!;
  const { offering, university, programme } = profile;
  const u = university.record;
  const p = programme.record;
  const master = getUniversityCourse(u.slug, p.slug);

  const faqs = [
    {
      question: `What is the ${p.name} fee at ${u.shortName}?`,
      answer: `The ${p.name} at ${u.shortName} sits in the ${p.feeRangeLabel} band across the full ${offering.durationLabel} programme. The exact figure is confirmed against the university's official fee page before publication.`,
    },
    {
      question: `What is the eligibility for ${p.name} at ${u.shortName}?`,
      answer: p.eligibility,
    },
    {
      question: `Which specialisations are available?`,
      answer: offering.specialisations
        .map((s) => getSpecialisation(p.slug, s)?.name ?? s)
        .join(", "),
    },
    {
      question: `Is this ${p.name} approved?`,
      answer: `${u.name} holds ${approvalText(u)}, so the degree carries the same recognition as the equivalent on-campus programme.`,
    },
  ];

  return (
    <>
      <DetailLayout
        crumbs={[
          { name: "Universities", href: "/universities" },
          { name: u.shortName, href: `/universities/${u.slug}` },
          { name: onlineName(p.shortName), href: profile.path },
        ]}
        eyebrow={`${u.shortName} · ${p.level} programme`}
        title={`${u.shortName} ${p.name}: Fees, Eligibility & Admission 2026`}
        subtitle={`${p.summary} This page covers the ${p.name} exactly as delivered by ${u.name}.`}
        meta={
          <>
            <div className="mb-5 max-w-xl">
              <QuickEnquiry heading={`Enquire about ${u.shortName}`} highlight={`${p.shortName} admission`} />
            </div>
            <UpdatedStamp date={offering.lastUpdated} verified={offering.verified} />
          </>
        }
        tocSections={[
          "Quick facts",
          "Overview",
          "Specialisations",
          "Fee structure",
          "Curriculum",
          "Sample degree",
          "Eligibility",
          "Required documents",
          "Admission process",
          "Examination pattern",
          "Placement support",
          "Career opportunities",
          "Scholarships",
          "Learning experience",
          "Who should choose it",
          "Sources & last verified",
          "FAQs",
          "Related links",
        ]}
        faqs={faqs}
        sidebarExtras={
          <>
            <LinkCluster title={`Other ${u.shortName} programmes`} links={offeringLinks(u.slug)} />
            <LinkCluster title={`${p.name} at other universities`} links={providerLinks(p.slug)} />
          </>
        }
        related={
          <RelatedLinkGrid
            groups={[
              { title: `${p.name} elsewhere`, links: providerLinks(p.slug) },
              { title: `More from ${u.shortName}`, links: offeringLinks(u.slug) },
              { title: "Comparisons", links: comparisonLinks(u.slug) },
              { title: "Related reading", links: articleLinks(4) },
            ]}
          />
        }
      >
        <QuickFacts
          items={[
            { label: "Programme", value: p.name },
            { label: "University", value: u.shortName },
            { label: "Level", value: p.level },
            { label: "Duration", value: offering.durationLabel },
            { label: "Mode", value: p.mode.join(", ") },
            { label: "Fee band", value: p.feeRangeLabel },
            { label: "Specialisations", value: offering.specialisations.length },
            { label: "Admissions", value: offering.admissionOpen ? "Open" : "Closed" },
          ]}
        />

        <ContentSection title="Overview">
          <p>
            {p.summary} At {u.name}, it runs for {offering.durationLabel} and is delivered {p.mode.join(" / ")}, with{" "}
            {approvalText(u)} backing the award.
          </p>
          <p>{u.verdict}</p>
          <ApprovalMarquee approvals={u.approvals} />
        </ContentSection>

        <ContentSection title="Specialisations">
          <SpecialisationBoxes
            scrolling
            label={`${p.name} specialisations at ${u.shortName}`}
            items={offering.specialisations.map((s) => {
              const spec = getSpecialisation(p.slug, s);
              return {
                name: spec?.name ?? s,
                href: specLandingPath(p.slug, spec?.name ?? s),
                meta: spec?.careerPaths.slice(0, 2).join(", ") || undefined,
              };
            })}
          />
          {master.course && (
            <SpecialisationElectives
              course={master.course}
              universitySpecialisations={master.specialisations}
              universityShort={u.shortName}
            />
          )}
        </ContentSection>

        <ContentSection title="Fee structure">
          <FeeHighlight fee={offering.fee} duration={offering.durationLabel} />
          <FeeComponents fee={offering.fee} />
          <p className="text-xs">
            Figures are published only after verification against the university's own fee schedule — nothing on this
            page is estimated.
          </p>
          <NextStep
            question="Want to see how this fee compares with other universities?"
            actionLabel="Compare universities"
            href={`/compare/${p.slug}`}
          />
        </ContentSection>

        {master.course && (
          <ContentSection title="Curriculum">
            <CurriculumSection
              course={master.course}
              universityShort={u.shortName}
              universitySpecificNote={master.curriculumNote}
            />
          </ContentSection>
        )}

        {degreeSample(u.slug) && (
          <ContentSection title="Sample degree">
            <SampleDegreeSection universityName={u.name} universitySlug={u.slug} />
          </ContentSection>
        )}

        <ContentSection title="Eligibility">
          <p>{p.eligibility}</p>
          {master.eligibility && <p>{master.eligibility}</p>}
          <NextStep
            question="Not sure you meet the published eligibility?"
            actionLabel="Check the admission process"
            href="#admission-process"
          />
        </ContentSection>

        <ContentSection title="Required documents">
          <RequiredDocuments documents={u.documentsRequired} />
        </ContentSection>

        <ContentSection title="Admission process">
          <div className="rounded-2xl border-2 border-brand p-4 sm:p-5">
            <SectionBanner kind="admission" />
            <AdmissionInsightSection
              universitySlug={u.slug}
              universityShort={u.shortName}
              courseSlug={p.slug}
              courseName={`${u.shortName} ${p.shortName}`}
            />
          </div>
        </ContentSection>

        <ContentSection title="Examination pattern">
          <div className="rounded-2xl border-2 border-brand p-4 sm:p-5">
            <SectionBanner kind="examination" />
            <ExaminationPatternSection
              universitySlug={u.slug}
              universityShort={u.shortName}
              courseSlug={p.slug}
              courseName={`${u.shortName} ${p.shortName}`}
            />
          </div>
        </ContentSection>

        <ContentSection title="Placement support">
          <PlacementSupportSection universitySlug={u.slug} universityShort={u.shortName} />
        </ContentSection>

        <ContentSection title="Career opportunities">
          {p.whoIsItFor.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {p.whoIsItFor.map((w) => (
                <li key={w} className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground">
                  {w}
                </li>
              ))}
            </ul>
          )}
          <CareerRolePackages
            roles={
              getCareerInfo(u.slug, p.slug)?.data.roles?.length
                ? getCareerInfo(u.slug, p.slug)!.data.roles!
                : Array.from(
                    new Set(
                      offering.specialisations.flatMap((s) => getSpecialisation(p.slug, s)?.careerPaths ?? []),
                    ),
                  ).slice(0, 10)
            }
            fallbackRoles={defaultRolesFor(p.slug)
            }
            universitySlug={u.slug}
            universityShort={u.shortName}
          />
          <CareerOpportunitiesSection
            universitySlug={u.slug}
            universityShort={u.shortName}
            courseSlug={p.slug}
            courseName={`${u.shortName} ${p.shortName}`}
          />
        </ContentSection>

        <ContentSection title="Scholarships">
          <ScholarshipCategories
            scholarships={master.scholarships}
            note={master.scholarshipNote}
            universityShort={u.shortName}
          />
          <ScholarshipInsightSection
            universitySlug={u.slug}
            universityShort={u.shortName}
            courseSlug={p.slug}
            courseName={`${u.shortName} ${p.shortName}`}
          />
        </ContentSection>

        <ContentSection title="Learning experience">
          <LearningSupport universityShort={u.shortName} />
        </ContentSection>

        <ContentSection title="Who should choose it">
          <ProgrammeDecision
            programmeName={p.name}
            universityShort={u.shortName}
            durationLabel={offering.durationLabel}
            eligibility={p.eligibility}
            hasVerifiedFee={offering.verified && offering.fee.total != null}
          />
          <NextStep
            question="Still deciding between universities for this course?"
            actionLabel="Open the comparison"
            href={`/compare/${p.slug}`}
          />
        </ContentSection>

        <ContentSection title="Sources & last verified">
          <ProgrammeSources
            universitySlug={u.slug}
            universityShort={u.shortName}
            websiteUrl={u.websiteUrl}
            lastVerified={offering.lastUpdated}
            status={offering.verified ? "verified_official" : "partial_verification"}
          />
        </ContentSection>

        <ContentSection title="Researched programme record">
          <PubCourseResearch universitySlug={u.slug} programmeSlug={p.slug} />
        </ContentSection>

        <SectionUrlGrid
          base={`/universities/${u.slug}/courses/${p.slug}`}
          title={`More on ${u.shortName} ${p.shortName}`}
        />

        <PromoBanner
          title={`Fee offers & scholarships on ${u.shortName} ${p.shortName}`}
          subtitle="Check the live scholarship slabs and EMI options before you apply."
          ctaLabel="Check my eligibility"
        />

        <RelatedPageLinks
          title={`${u.shortName} reference pages`}
          links={[
            { label: `${u.shortName} overview`, href: `/universities/${u.slug}` },
            ...universitySectionPages(u.slug).map((sec) => ({
              label: `${u.shortName} ${sectionLabels[sec].toLowerCase()}`,
              href: `/universities/${u.slug}/${sec}`,
            })),
          ]}
        />

        <AuthorBox />
        <References
          items={[
            { label: "UGC-DEB entitled programme list", href: "https://deb.ugc.ac.in/" },
          ]}
        />
      </DetailLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
    </>
  );
}
