import type { getFundingGrant } from "../fundingOptions";

interface Props {
  grant: NonNullable<ReturnType<typeof getFundingGrant>>;
}

/** Both supplied PNGs have the same 3603×459 ratio and sit on one black strip. */
const FundingBanner = ({ grant }: Props) => (
  <div
    data-funding-banner={grant.value}
    className="relative z-10 flex w-full shrink-0 items-center gap-8 bg-black px-16 py-8"
  >
    <img
      src={grant.leftImage}
      alt=""
      width="3603"
      height="459"
      className="block w-0 min-w-0 flex-1"
    />
    <img
      src={grant.rightImage}
      alt=""
      width="3603"
      height="459"
      className="block w-0 min-w-0 flex-1"
    />
  </div>
);

export default FundingBanner;
