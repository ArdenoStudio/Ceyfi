import Image from "next/image";

function Divider() {
  return <span className="w-px h-5 bg-seylan-border shrink-0" aria-hidden="true" />;
}

export function TechStrip() {
  return (
    <section className="border-t border-seylan-border bg-seylan-mist py-10 px-6">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">
        Powered by
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 max-w-4xl mx-auto">
        {/* Seylan Bank */}
        <div className="flex items-center gap-2">
          <Image
            src="/seylan-bank-logo.png"
            alt="Seylan Bank"
            width={120}
            height={32}
            className="h-7 w-auto opacity-80"
          />
        </div>

        <Divider />

        {/* Groq */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[#F55036]" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-mono font-bold text-sm text-[#F55036] tracking-tight">Groq</span>
        </div>

        <Divider />

        {/* ElevenLabs */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-seylan-charcoal/70" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12h3M7 6v12M11 4v16M15 8v8M19 6v12M22 12h1" />
          </svg>
          <span className="font-semibold text-sm text-seylan-charcoal/70 tracking-tight">ElevenLabs</span>
        </div>

        <Divider />

        {/* Supabase */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[#3ECF8E]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C.111 12.876.706 14.087 1.75 14.087h8.84l.012 8.878c.015.985 1.26 1.409 1.874.636l9.262-11.652c.653-.826.058-2.036-.986-2.036h-8.84L11.9 1.036z" />
          </svg>
          <span className="font-semibold text-sm text-seylan-charcoal/70 tracking-tight">Supabase</span>
        </div>

        <Divider />

        {/* Vercel */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-seylan-charcoal/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 1L24 22H0L12 1z" />
          </svg>
          <span className="font-semibold text-sm text-seylan-charcoal/70 tracking-tight">Vercel</span>
        </div>

        <Divider />

        {/* Cursor */}
        <div className="flex items-center gap-1.5">
          <svg className="h-5 w-5" viewBox="600 300 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#14120B" d="M999.994 554.294C999.994 559.859 999.994 565.419 999.962 570.984C999.935 575.67 999.882 580.357 999.753 585.038C999.475 595.247 998.875 605.542 997.059 615.639C995.217 625.88 992.212 635.409 987.477 644.718C982.822 653.861 976.738 662.233 969.485 669.491C962.227 676.748 953.861 682.828 944.712 687.482C935.409 692.217 925.875 695.222 915.633 697.065C905.537 698.88 895.242 699.48 885.033 699.759C880.346 699.887 875.665 699.941 870.978 699.968C865.413 700.005 859.853 700 854.288 700H745.695C740.13 700 734.571 700 729.005 699.968C724.319 699.941 719.632 699.887 714.951 699.759C704.742 699.48 694.447 698.88 684.35 697.065C674.109 695.222 664.58 692.217 655.271 687.482C646.128 682.828 637.756 676.743 630.499 669.491C623.241 662.233 617.161 653.866 612.507 644.718C607.772 635.414 604.767 625.88 602.925 615.639C601.109 605.542 600.509 595.247 600.23 585.038C600.102 580.352 600.048 575.67 600.021 570.984C600 565.419 600 559.859 600 554.294V445.701C600 440.136 600 434.576 600.032 429.011C600.059 424.324 600.112 419.637 600.241 414.956C600.52 404.747 601.119 394.452 602.935 384.356C604.778 374.115 607.783 364.586 612.518 355.277C617.172 346.133 623.257 337.762 630.509 330.504C637.767 323.246 646.133 317.167 655.282 312.512C664.586 307.777 674.12 304.772 684.361 302.93C694.458 301.114 704.752 300.514 714.961 300.236C719.648 300.107 724.329 300.054 729.016 300.027C734.576 300 740.136 300 745.701 300H854.294C859.859 300 865.419 300 870.984 300.032C875.67 300.059 880.357 300.112 885.038 300.241C895.247 300.52 905.542 301.119 915.639 302.935C925.88 304.778 935.409 307.783 944.718 312.518C953.861 317.172 962.233 323.257 969.491 330.509C976.748 337.767 982.828 346.133 987.482 355.282C992.217 364.586 995.222 374.12 997.065 384.361C998.88 394.458 999.48 404.752 999.759 414.961C999.887 419.648 999.941 424.329 999.968 429.016C1000.01 434.581 1000 440.141 1000 445.706V554.299L999.994 554.294Z" />
            <path fill="#EDECEC" d="M920.015 424.958L805.919 359.086C802.256 356.97 797.735 356.97 794.071 359.086L679.981 424.958C676.901 426.736 675 430.025 675 433.587V566.419C675 569.981 676.901 573.269 679.981 575.048L794.077 640.92C797.74 643.036 802.261 643.036 805.925 640.92L920.02 575.048C923.1 573.269 925.001 569.981 925.001 566.419V433.587C925.001 430.025 923.1 426.736 920.02 424.958H920.015ZM912.848 438.911L802.706 629.682C801.961 630.968 799.995 630.443 799.995 628.954V504.039C799.995 501.543 798.662 499.234 796.498 497.981L688.321 435.526C687.036 434.781 687.561 432.816 689.05 432.816H909.334C912.462 432.816 914.417 436.206 912.853 438.917H912.848V438.911Z" />
          </svg>
          <span className="font-semibold text-sm text-seylan-charcoal/70 tracking-tight">Cursor</span>
        </div>

        <Divider />

        {/* OpenAI */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-seylan-charcoal/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.372L15.115 7.2a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.403-.662zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
          </svg>
          <span className="font-semibold text-sm text-seylan-charcoal/70 tracking-tight">OpenAI</span>
        </div>
      </div>
    </section>
  );
}
