import { notFound } from 'next/navigation';
import BookingForm from '@/components/booking/BookingForm';
import Container from '@/components/ui/Container';
import { features, getSectionContent, siteConfig } from '@/config/site';
import { bookableDates } from '@/lib/booking/dates';
import { whatsappLink } from '@/lib/whatsapp';
import { listBookableOfferings } from '@/server/modules/catalog/service';
import styles from './page.module.css';

export const metadata = {
  title: `Agendar horário — ${siteConfig.identity.name}`,
  description: `Peça seu horário em ${siteConfig.identity.name}: escolha o serviço, o dia e o período, e a gente confirma com você.`,
};

/** Serviços vêm do banco e os dias dependem de hoje: nada aqui é estático. */
export const dynamic = 'force-dynamic';

/**
 * Pedido de agendamento.
 *
 * Os dias são calculados aqui, no fuso da empresa, e entregues prontos ao
 * formulário: se o celular do cliente estiver com o relógio ou o fuso errado,
 * ele continua vendo os dias certos. A API recalcula ao receber.
 */
export default async function AgendarPage({ searchParams }) {
  if (!features.booking) notFound();

  const content = getSectionContent('booking');
  const params = await searchParams;
  const regras = siteConfig.booking;

  let services = null;
  try {
    services = await listBookableOfferings();
  } catch (error) {
    console.error('[agendar] serviços indisponíveis', error?.message);
  }

  const whatsapp = whatsappLink(
    siteConfig.contact.whatsapp,
    'Olá! Gostaria de agendar um horário.',
  );

  return (
    <>
      <section className={styles.intro}>
        <Container>
          <h1 className={styles.title}>{content.title}</h1>
          {content.text && <p className={styles.text}>{content.text}</p>}
        </Container>
      </section>

      <Container>
        <div className={styles.formWrapper}>
          {services && services.length > 0 ? (
            <BookingForm
              services={services}
              dates={bookableDates(regras)}
              periods={regras.periods}
              professionals={regras.professionals}
              initialServiceId={
                typeof params?.servico === 'string' ? params.servico : null
              }
              successText={content.successText}
              whatsappNumber={siteConfig.contact.whatsapp}
            />
          ) : (
            // Sem serviço agendável (ou banco fora do ar), a página não finge
            // que funciona: explica e oferece o caminho que sempre funciona.
            <div className={styles.fallback} role="status">
              <p>
                {services
                  ? 'O agendamento pelo site ainda não está disponível.'
                  : 'Não conseguimos carregar os serviços agora.'}
              </p>
              {whatsapp && (
                <a className={styles.fallbackLink} href={whatsapp}>
                  Agendar pelo WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
