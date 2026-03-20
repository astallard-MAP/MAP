
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { AuctionAcademyChatbot } from "@/components/chat/AuctionAcademyChatbot";
import { auctionFaqs } from "@/lib/auction-faqs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AuctionNews } from "@/components/AuctionNews";

export default function AuctionAcademyPage() {
  
  const frankAvatar = PlaceHolderImages.find(img => img.id === 'frank-tadsworth-bids-avatar');

  return (
    <div className="relative min-h-[calc(100vh-100px)]">
        <div className="flex flex-col gap-6 pb-24">
        <header>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
            <GraduationCap className="mr-3 h-8 w-8" />
            Auction Academy
            </h1>
            <p className="text-muted-foreground mt-2">
            Your comprehensive guide to understanding the benefits and processes of selling property by auction.
            </p>
        </header>

        <Alert>
            <GraduationCap className="h-4 w-4" />
            <AlertTitle>Coming Soon!</AlertTitle>
            <AlertDescription>
                Continued Professional Development training courses and certification will be available soon.
            </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Ask Frank Anything About Auctions</CardTitle>
                        <CardDescription>Our AI expert, Frank Tadsworth-Bids, is here to answer your questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[500px]">
                            <AuctionAcademyChatbot />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                        <CardDescription>
                            Find answers to the most common questions about each auction method.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {auctionFaqs.map((section) => (
                            <AccordionItem value={section.type} key={section.type}>
                                <AccordionTrigger className="text-lg font-semibold">{section.type}</AccordionTrigger>
                                <AccordionContent>
                                <div className="space-y-6 pl-4">
                                    {section.faqs.map((faq, index) => (
                                    <div key={index}>
                                        <h4 className="font-semibold text-base">{faq.question}</h4>
                                        <p className="text-muted-foreground mt-1 text-sm">{faq.answer}</p>
                                    </div>
                                    ))}
                                </div>
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
            <AuctionNews />
        </div>
        </div>
        {frankAvatar && (
            <div className="fixed bottom-4 right-4 z-10 pointer-events-none">
                <Image
                    src={frankAvatar.imageUrl}
                    alt="Frank Tadsworth-Bids"
                    width={150}
                    height={150}
                    className="rounded-full"
                    data-ai-hint={frankAvatar.imageHint}
                />
            </div>
        )}
    </div>
  );
}
