import Media from '@/components/ui/Media';
import styles from './testimonials.module.css';

/** Avatar + nome/cargo do autor de um depoimento. */
export default function TestimonialAuthor({ author, role, avatar }) {
  if (!author && !role) return null;

  return (
    <div className={styles.author}>
      <Media
        src={avatar}
        alt={author ?? ''}
        ratio="1 / 1"
        className={styles.avatar}
      />
      <div>
        {author && <p className={styles.authorName}>{author}</p>}
        {role && <p className={styles.authorRole}>{role}</p>}
      </div>
    </div>
  );
}
