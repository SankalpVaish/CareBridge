/**
 * SchemeChecker — scheme & financial-aid eligibility checker (A-9..A-12).
 *
 * Shows which schemes the patient holds or may qualify for (A-9), what each
 * covers, the rules that can block or delay care (A-10), extra scholarships /
 * charity / NGO aid they'd otherwise miss (A-11), and the exact documents to
 * bring — flagged by how hard each is to produce (A-12).
 *
 * Self-contained to the care feature. Imports only shared UI primitives
 * (not modified) and the local eligibility helper. No shared data is changed.
 */
import { Card, Badge } from '../../shared/ui.jsx'
import { checkEligibility } from './schemeEligibility.js'
import { useCarePrefs, ReadAloudButton } from './carePreferences.jsx'

/**
 * @param {Object} props
 * @param {import('../../shared/models.js').Patient} props.patient
 */
export default function SchemeChecker({ patient }) {
  const { t, code } = useCarePrefs()
  const { schemes, aid, hardDocs } = checkEligibility(patient, code)

  const schemesToShow = schemes.filter((s) => s.status !== 'unlikely')
  const aidToShow = aid.filter((a) => a.status !== 'unlikely')

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{t('aid.title')}</h2>
        <Badge tone="slate">A-9..A-12</Badge>
      </div>
      <div className="mt-1 flex items-start gap-1">
        <p className="text-sm text-slate-600">{t('aid.intro')}</p>
        <ReadAloudButton text={t('aid.intro')} className="shrink-0" />
      </div>

      {/* Hard-document warning (A-12) */}
      {hardDocs.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">{t('aid.sortEarly')}</p>
          <p className="mt-1">
            {t('aid.hardDocsBody')}{' '}
            <span className="font-medium">{hardDocs.join(', ')}</span>.
          </p>
        </div>
      )}

      {/* Schemes the patient holds / may qualify for (A-9) */}
      <SectionTitle>{t('aid.schemes')}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {schemesToShow.map((s) => (
          <ProgramCard key={s.id} program={s} />
        ))}
        {schemesToShow.length === 0 && (
          <EmptyNote>{t('aid.noSchemes')}</EmptyNote>
        )}
      </div>

      {/* Scholarships / charity / NGO aid (A-11) */}
      <SectionTitle>{t('aid.scholarships')}</SectionTitle>
      <p className="-mt-2 mb-3 text-xs text-slate-500">
        {t('aid.scholarshipsHint')}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {aidToShow.map((a) => (
          <ProgramCard key={a.id} program={a} />
        ))}
        {aidToShow.length === 0 && (
          <EmptyNote>{t('aid.noAid')}</EmptyNote>
        )}
      </div>
    </Card>
  )
}

function ProgramCard({ program }) {
  const { t } = useCarePrefs()
  const statusTone =
    program.status === 'enrolled'
      ? 'green'
      : program.status === 'may_qualify'
        ? 'blue'
        : 'slate'

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{program.name}</p>
          <p className="text-xs text-slate-500">
            {t(`kind.${program.kind}`)}
            {program.coveragePct != null &&
              ` · ${t('aid.coversUpTo')} ${program.coveragePct}%`}
          </p>
        </div>
        <Badge tone={statusTone}>{t(`status.${program.status}`)}</Badge>
      </div>

      {(program.summary || program.notes) && (
        <p className="mt-1 text-sm text-slate-600">
          {program.summary || program.notes}
        </p>
      )}

      {/* What it covers (A-9) */}
      {program.covers?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {program.covers.map((c) => (
            <span
              key={c}
              className="rounded-full bg-care/10 px-2 py-0.5 text-xs text-care"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Why you qualify / don't (A-9) */}
      {program.reasons?.length > 0 && (
        <p className="mt-2 text-xs text-green-700">
          ✓{' '}
          {program.reasons
            .map((r) => (r === '__enrolled__' ? t('aid.alreadyEnrolled') : r))
            .join(' · ')}
        </p>
      )}
      {program.missingReasons?.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          {t('aid.needs')}: {program.missingReasons.join(' · ')}
        </p>
      )}

      {/* Rules that can block or delay care (A-10) */}
      {program.blockers?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-700">{t('aid.watchOut')}</p>
          <ul className="mt-0.5 list-disc pl-4 text-xs text-slate-600">
            {program.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Documents needed, with difficulty (A-12) */}
      {program.documents?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-700">{t('aid.bring')}</p>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {program.documents.map((d) => (
              <DocChip key={d.name} doc={d} />
            ))}
          </div>
        </div>
      )}

      {program.howToApply && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{t('aid.howToApply')}: </span>
          {program.howToApply}
        </p>
      )}
    </div>
  )
}

function DocChip({ doc }) {
  const { t } = useCarePrefs()
  const tone =
    doc.difficulty === 'hard'
      ? 'bg-red-50 text-red-700 border-red-200'
      : doc.difficulty === 'medium'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-600 border-slate-200'
  const title = t(`doc.diff.${doc.difficulty}`)
  return (
    <span
      title={title}
      className={`rounded-full border px-2 py-0.5 text-xs ${tone}`}
    >
      {doc.name}
      {doc.difficulty === 'hard' && ' ⚠'}
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 mt-5 text-sm font-semibold text-slate-800">
      {children}
    </h3>
  )
}

function EmptyNote({ children }) {
  return <p className="text-sm text-slate-500">{children}</p>
}
