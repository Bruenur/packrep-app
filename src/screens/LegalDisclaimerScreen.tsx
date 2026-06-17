import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { s } from "../ui/styles";

const platformDisclaimer = `PackRep is a software and advertising platform designed to help users identify, organize, and communicate with housing-related professionals and opportunities. PackRep is not a real estate broker, mortgage lender, credit repair organization, settlement service provider, law firm, or financial advisor, and does not provide real estate, mortgage, legal, tax, credit, or financial advice.

Any builder, sales counselor, lender, credit repair provider, or other professional displayed on PackRep may include paid advertisers, sponsored placements, or user-selected favorites. Sponsored placement provides visibility only and does not constitute a recommendation, endorsement, guarantee of quality, guarantee of availability, guarantee of incentives, or a representation that any provider is the best option for a particular user or client.

Search results, map placements, card rankings, and matches may be based on user-selected filters, location, availability, profile completeness, user preferences, and/or promotional status. Users are solely responsible for independently verifying all pricing, incentives, property details, school information, licensing status, availability, qualifications, and terms directly with the applicable provider before relying on any information presented through the platform.

PackRep does not represent either party in a real estate transaction and does not create any agency, brokerage, fiduciary, joint venture, or employment relationship between PackRep and any user, consumer, builder, sales counselor, brokerage, lender, or service provider.`;

const sponsoredLabel = `Sponsored placement: paid visibility only. Not a recommendation, ranking guarantee, or representation of best fit.`;
const advertiserCert = `By posting or advertising on PackRep, you represent and warrant that you hold all licenses, approvals, permissions, and broker authorization required for your content, advertising, and communications, and that your information is accurate and not misleading.`;

export default function LegalDisclaimerScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.card}><Text style={s.h1}>Legal / Disclaimer</Text><Text style={s.small}>Use this section for platform disclosure language.</Text></View>
      <View style={s.card}><Text style={s.h2}>Platform Disclaimer</Text><Text style={s.listSub}>{platformDisclaimer}</Text></View>
      <View style={s.card}><Text style={s.h2}>Sponsored Label</Text><Text style={s.listSub}>{sponsoredLabel}</Text></View>
      <View style={s.card}><Text style={s.h2}>Advertiser Certification</Text><Text style={s.listSub}>{advertiserCert}</Text></View>
      <View style={[s.card, { gap: 10 }]}><Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable></View>
    </ScrollView>
  );
}
