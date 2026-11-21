import { Shield, Tv } from "lucide-react";

/**
 * Sits right next to a Pay / Unlock button: the guarantee in plain words,
 * plus who is behind it. This is the moment people hesitate.
 */
const PayReassurance = ({ dark = false, className = "" }: { dark?: boolean; className?: string }) => {
  const box = dark ? "bg-primary-foreground/5 border-primary-foreground/10" : "bg-accent/5 border-accent/20";
  const head = dark ? "text-primary-foreground" : "text-foreground";
  const body = dark ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <div className={`rounded-xl border ${box} p-4 space-y-3 ${className}`}>
      <div className="flex gap-3">
        <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className={`font-body text-sm font-semibold ${head}`}>100% money-back guarantee</p>
          <p className={`font-body text-xs leading-relaxed ${body}`}>
            Not happy with your speech? Email me and I'll refund you in full. You've nothing to lose.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Tv className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className={`font-body text-sm font-semibold ${head}`}>Adrian Simpson, former BBC Top Gear &amp; Sky News presenter</p>
          <p className={`font-body text-xs leading-relaxed ${body}`}>
            Writing wedding speeches since 2012. 4.9/5 from 421 verified reviews.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayReassurance;
