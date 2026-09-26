export default function SiteFooter({ awardName }: { awardName: string }) {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white py-8 text-center text-sm text-neutral-500">
      <p>
        &copy; {new Date().getFullYear()} {awardName}. All rights reserved.
      </p>
    </footer>
  );
}
