import { Heading, Page } from "@shopify/polaris";
import DisplayCoupons from "../components/displayCoupons";

const Index = () => (
  <Page>
    <Heading>Discounts on the store 🎉</Heading>
    <DisplayCoupons />
  </Page>
);

export default Index;
