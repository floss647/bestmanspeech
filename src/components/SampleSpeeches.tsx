import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Users, Award } from "lucide-react";
import { useGeolocation } from "@/contexts/GeolocationContext";

const samples = [
  {
    id: 1,
    title: "Best Man Speech",
    groom: "Michael",
    bride: "Emma",
    excerpt: "I have known Michael since we were seventeen and broke, sleeping on each other's couches and convinced we would figure out the world. Turns out, we did, but not in the way we imagined.",
    icon: Heart,
    speech: `I have known Michael since we were seventeen and broke, sleeping on each other's couches and convinced we would figure out the world. Turns out, we did, but not in the way we imagined. And then Emma walked in, and everything made sense.

Michael has always been the kind of friend who shows up. Not because he is obligated, but because he wants to be there. He is the one you call at two in the morning. The one who remembers what you said six months ago that you had already forgotten. The one who makes terrible jokes but somehow always gets the laugh.

I remember the first time he told me about Emma. We were sitting in the back of a pub in Clapham, halfway through a pint, and he just stopped mid sentence and said, "I think I have met someone different." Now, Michael had said things like that before, so I did not think much of it. But then he kept talking. He talked about how she laughed. How she called him out when he was being ridiculous. How she made him want to try harder. That was new.

Over the next few weeks I watched something shift. He started showing up on time. He stopped cancelling plans. He would check his phone and smile, and when I asked who it was he would just shrug and change the subject, which told me everything.

The first time I met Emma was at a barbecue Michael threw at his flat. She walked in and immediately started helping set up, even though she did not know most of the people there. Within ten minutes she had made everyone feel welcome. She remembered names. She asked questions and actually listened to the answers. I looked at Michael across the room and he was just watching her, grinning like an idiot. That was the moment I knew.

Emma, from the bottom of my heart, thank you. Thank you for loving him the way he deserves. Thank you for making him happier than I have ever seen him. Thank you for being patient with his inability to load a dishwasher correctly. And thank you for becoming part of our lives, because you have made all of us better just by being around.

Michael, you are my best friend. You have been there for me through things I do not even talk about, and I will never forget that. Watching you grow from that broke kid on my couch into the man standing here today has been one of the great privileges of my life. You deserve this. You deserve her. And I could not be prouder of you.

To everyone here, please raise your glasses. To Michael and Emma. May you always choose each other, even on the hard days. May you keep laughing at each other's terrible jokes. And may you never stop being the kind of people who show up for the ones they love.

To the happy couple!`
  },
  {
    id: 2,
    title: "Maid of Honour Speech",
    bride: "Sophie",
    groom: "James",
    excerpt: "Sophie has been my person since we were twelve. We have been through everything together. Bad haircuts, worse breakups, dreams we thought were impossible and dreams we somehow made real.",
    icon: Users,
    speech: `Sophie has been my person since we were twelve. We have been through everything together. Bad haircuts, worse breakups, dreams we thought were impossible and dreams we somehow made real. She is the first person I call when something good happens, and the first person I call when everything falls apart.

If I am honest, when Sophie first told me about James, I was skeptical. Not because there is anything wrong with him, but because I wanted her to be with someone who truly deserved her. Someone who understood how rare she is. Someone who would not just love her on the easy days but would stay on the difficult ones too.

And then I met him, and I understood. It was a Sunday afternoon and we were all at Sophie's flat. James was in the kitchen making tea for everyone, and he knew exactly how Sophie took hers without asking. That sounds small, but it is not. It is the kind of thing that tells you someone has been paying attention. Someone has been choosing to notice.

Over the following months I watched them together. I saw how he listened when she talked, really listened, not just waiting for his turn to speak. I saw how he would put his hand on her back when they walked through a crowded room, not to guide her but just to let her know he was there. I saw how she became calmer around him, more herself, more settled in a way I had not seen before.

Sophie, you have taught me what it means to be brave. To ask for what you want. To walk away from things that do not serve you and towards things that do. You are not just my best friend. You are my inspiration. You are the reason I believe that good things happen to good people, because you are the best person I know and you have found the best thing.

James, I want you to know something. You are not just marrying Sophie. You are gaining a whole community of people who would go to war for her. We are fiercely protective, occasionally terrifying, and we will always be watching. But we are also so glad you are here. You make her happy. That is all we have ever wanted.

To Sophie and James. Here is to love that is both comfortable and exciting, familiar and surprising. Here is to lazy Sunday mornings and spontaneous adventures. Here is to becoming each other's favourite person, today and every day after.

To the happy couple!`
  },
  {
    id: 3,
    title: "Father of the Bride Speech",
    bride: "Rachel",
    groom: "David",
    excerpt: "Rachel, you have been my greatest joy since the day you were born. Watching you grow into the woman you are today, strong, kind, brilliant, has been the honour of my life.",
    icon: Award,
    speech: `Rachel, you have been my greatest joy since the day you were born. Watching you grow into the woman you are today, strong, kind, brilliant, has been the honour of my life. And standing here now, looking at you in that dress, I am trying very hard to hold it together.

When you were little, you would hold my hand everywhere we went. You would trust me to keep you safe, to know the answers, to make everything okay. As you grew, you let go of my hand gradually, and I knew that meant I had done something right. You became independent, compassionate, curious about the world and determined to make your mark on it.

I remember the day you started school. You walked through those gates without looking back, and your mother had to stop me from running in after you. I remember your first concert, where you sang slightly off key but with more conviction than anyone else on that stage. I remember the day you graduated, and I sat in the audience thinking, "That is my daughter. That extraordinary person is my daughter."

And then David came along. I will admit I was cautious at first. Every father is. But David, you won me over quickly and completely. It was not one big moment. It was a hundred small ones. The way you held the door for Rachel. The way you remembered her favourite flowers. The way you talked about her when she was not in the room, with this quiet pride and genuine wonder, as if you still could not believe your luck.

I watched you together over the months and years, and I saw something I had hoped for but never assumed I would find. I saw someone who sees Rachel. Really sees her. Not just the bright, confident woman the world gets, but the quieter version too. The one who worries. The one who needs reassurance. The one who still calls her dad when she cannot sleep. You see all of her, and you love all of her, and that is everything.

David, I want you to know what you are getting. You are getting a woman who will challenge you to be better. Who will call you out when you are wrong and celebrate you when you are right. You are getting someone who loves deeply and fiercely, who will build a home with you that is full of laughter and warmth and probably too many cushions. You are getting the best person I know. Take care of her.

Rachel, I am not losing a daughter. I am gaining a son. And I am gaining the peace of knowing that you are going to be okay. More than okay. You are going to be happy.

To everyone here, I want to say something to both of them. Marriage is a privilege. Some days will be easy. Some days will test you. On the hard days, remember why you chose each other. Remember this feeling. Remember this room full of people who love you. Remember this day.

I am so proud of you both. I love you so much.

To Rachel and David!`
  },
  {
    id: 4,
    title: "Wedding Toast",
    bride: "Lucy",
    groom: "Tom",
    excerpt: "I have known Tom for fifteen years, and I have never seen him like this. Lucy, you did that. You made him better. Not by changing him, but by making him want to change himself.",
    icon: Heart,
    speech: `I have known Tom for fifteen years, and I have never seen him like this. Lucy, you did that. You made him better. Not by changing him, but by making him want to change himself.

For years, Tom was the guy who would show up with a joke and leave before things got too serious. He was the life of every party but somehow always the first to slip out the door. Then he met Lucy, and he started staying. He started wanting to stay. He started wanting to be the last one there, not the first one gone.

I remember when he first brought Lucy to meet the group. We were at a pub quiz, badly losing as usual, and Lucy sat down, looked at the question sheet, and calmly got seven answers right in a row. Tom just sat there beaming. Not because they were winning, but because he was proud. Genuinely proud to be with someone that brilliant and that unafraid to show it.

What struck me most was how natural they were together. There was no performance, no trying to impress. They just fit. Lucy would finish Tom's sentences and he would roll his eyes but you could see he loved it. Tom would make one of his terrible puns and Lucy would groan but then laugh properly, the kind of laugh you cannot fake.

Over the months that followed, I watched Tom become someone I always knew he could be. He became more thoughtful, more present, more willing to have the conversations that matter. Lucy did not demand any of that. She just created the space for it. She made him feel safe enough to be vulnerable, which is no small thing for a man who once described his emotional range as "fine" and "hungry."

The thing about real love is that you can feel it in the room. You can see it in how they look at each other when they think nobody is watching. In the small touches. In the way they choose each other again and again, not out of obligation but out of genuine desire to be together.

Tom and Lucy, you have found something rare. Something most people spend their whole lives searching for. Hold onto it. Protect it. Water it like a plant and do not forget to give it sunlight.

Please raise your glasses. To Tom and Lucy. To love that is real, and lasting, and worth every moment.

To the happy couple!`
  }
];

const SampleSpeeches = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = samples.find(s => s.id === selectedId);
  const { localize } = useGeolocation();

  return (
    <section id="samples" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">
            See the Quality
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Real Speeches, Proven Results
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
            These aren't templates or generic samples. Each one uses Adrian Simpson's methodology to create something authentic and unforgettable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {samples.map((sample, index) => {
            const IconComponent = sample.icon;
            return (
              <motion.button
                key={sample.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedId(sample.id)}
                className="group text-left rounded-xl border border-border bg-card p-6 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <IconComponent className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {localize(sample.title)}
                </h3>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  For {sample.bride}{sample.groom ? ` & ${sample.groom}` : ""}
                </p>
                <p className="font-body text-sm text-foreground leading-relaxed line-clamp-3">
                  {localize(sample.excerpt)}
                </p>
                <p className="font-body text-xs text-gold mt-4 group-hover:text-gold-dark transition-colors">
                  Read full speech →
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-charcoal/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-xl max-w-2xl max-h-[80vh] overflow-y-auto w-full relative"
            >
              <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {localize(selected.title)}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    For {selected.bride}{selected.groom ? ` & ${selected.groom}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 hover:bg-card rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap">
                  {localize(selected.speech)}
                </div>
              </div>

              <div className="sticky bottom-0 bg-background border-t border-border p-6">
                <a
                  href="/write"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gold hover:bg-gold-dark text-accent-foreground font-body font-semibold text-sm rounded-lg transition-all duration-300"
                >
                  Write Your Own Speech
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default SampleSpeeches;
